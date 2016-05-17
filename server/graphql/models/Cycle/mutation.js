import raven from 'raven'

import {GraphQLNonNull, GraphQLID, GraphQLInt} from 'graphql'
import {GraphQLInputObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {GraphQLDateTime} from 'graphql-custom-types'

import {GOAL_SELECTION, PRACTICE} from '../../../../common/models/cycle'
import {getModeratorById, getCyclesInStateForChapter} from '../../helpers'
import {Cycle, CycleState} from './schema'
import {userCan} from '../../../../common/util'
import {cycleSchema} from '../../../../common/validations'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export const InputCycle = new GraphQLInputObjectType({
  name: 'InputCycle',
  description: 'The cycle',
  fields: () => ({
    id: {type: GraphQLID, description: 'The cycle UUID'},
    chapterId: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
    cycleNumber: {type: new GraphQLNonNull(GraphQLInt), description: 'Sequential cycle number'},
    startTimestamp: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The start time'},
    state: {type: CycleState, description: 'What state the cycle is currently in'},
  })
})

export default {
  createOrUpdateCycle: {
    type: Cycle,
    args: {
      cycle: {type: new GraphQLNonNull(InputCycle)},
    },
    async resolve(source, {cycle}, {rootValue: {currentUser}}) {
      if (cycle.id && !userCan(currentUser, 'updateCycle') || !cycle.id && !userCan(currentUser, 'createCycle')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        await cycleSchema.validate(cycle) // validation error will be thrown if invalid
        const chapter = await r.table('chapters').get(cycle.chapterId).run()
        if (!chapter) {
          throw new GraphQLError(`No chapter exists with id ${cycle.chapterId}`)
        }
        const now = r.now()
        let cycleWithTimestamps = Object.assign(cycle, {updatedAt: now})
        let savedCycle
        if (cycle.id) {
          savedCycle = await r.table('cycles')
            .get(cycle.id)
            .update(cycleWithTimestamps, {returnChanges: 'always'})
            .run()
        } else {
          cycleWithTimestamps = Object.assign(cycleWithTimestamps, {createdAt: now})
          savedCycle = await r.table('cycles')
            .insert(cycleWithTimestamps, {returnChanges: 'always'})
            .run()
        }

        if (savedCycle.replaced || savedCycle.inserted) {
          const returnedCycle = Object.assign({}, savedCycle.changes[0].new_val, {chapter})
          delete returnedCycle.chapterId
          return returnedCycle
        }
        throw new GraphQLError('Could not save cycle, please try again')
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
  launchCycle: {
    type: Cycle,
    args: {
      id: {type: GraphQLID},
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      if (!userCan(currentUser, 'launchCycle')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        // if the user is not a moderator, the cycle ID is required
        let cycle
        if (args.id) {
          cycle = await r.table('cycles').get(args.id).run()
        } else {
          const moderator = await getModeratorById(currentUser.id)
          if (!moderator) {
            throw new GraphQLError('You are not a moderator for the game.')
          }
          const cycles = await getCyclesInStateForChapter(moderator.chapter.id, GOAL_SELECTION)
          if (!cycles.length > 0) {
            throw new GraphQLError(`No cycles for ${moderator.chapter.name} chapter (${moderator.chapter.id}) in ${GOAL_SELECTION} state.`)
          }
          cycle = cycles[0]
        }

        const savedCycle = await r.table('cycles')
          .get(cycle.id)
          .update({state: PRACTICE, updatedAt: r.now()}, {returnChanges: 'always'})
          .run()

        if (savedCycle.replaced) {
          const returnedCycle = Object.assign({}, savedCycle.changes[0].new_val, {chapter: cycle.chapter})
          delete returnedCycle.chapterId
          return returnedCycle
        }
        throw new GraphQLError('Could not save cycle, please try again')
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  }
}
