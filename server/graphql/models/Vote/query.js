import raven from 'raven'

import {GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {GOAL_SELECTION} from '../../../../common/models/cycle'
import {CycleVotingResults} from './schema'
import {getCycleById, getPlayerById, getCyclesInStateForChapter} from '../../helpers'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getCycleVotingResults: {
    type: CycleVotingResults,
    args: {
      cycleId: {type: GraphQLID}
    },
    async resolve(source, args, {rootValue: {currentUser}}) {
      // only signed-in users can vote
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      try {
        let cycle
        if (args.cycleId) {
          cycle = await getCycleById(args.cycleId)
        } else {
          const player = await getPlayerById(currentUser.id)
          if (!player) {
            throw new GraphQLError('You are not a player in the game.')
          }

          const cycles = await getCyclesInStateForChapter(player.chapter.id, GOAL_SELECTION)
          if (!cycles.length > 0) {
            throw new GraphQLError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in ${GOAL_SELECTION} state.`)
          }
          cycle = cycles[0]
        }

        const numEligiblePlayers = await r.table('players')
          .getAll(cycle.chapter.id, {index: 'chapterId'})
          .count()
          .run()
        const validVotesQuery = r.table('votes')
          .getAll(cycle.id, {index: 'cycleId'})
          .hasFields('goals')
        const numVotes = await validVotesQuery.count().run()
        const candidateGoals = await validVotesQuery
          .group(r.row('goals').pluck('url', 'title'), {multi: true})
          .ungroup()
          .map(doc => {
            return {
              goal: doc('group'),
              playerGoalRanks: doc('reduction').map(vote => {
                return {
                  playerId: vote('playerId'),
                  goalRank: vote('goals')('url').offsetsOf(doc('group')('url')).nth(0)
                }
              })
            }
          })
          .orderBy(r.desc(r.row('playerGoalRanks').count()))
          .run()

        return {
          id: 'cycleVotingResults',
          cycle,
          numEligiblePlayers,
          numVotes,
          candidateGoals,
        }
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  }
}
