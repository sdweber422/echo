import raven from 'raven'

import {GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {GraphQLURL} from 'graphql-custom-types'

import {Vote} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  voteForGoals: {
    type: Vote,
    args: {
      playerId: {type: GraphQLID},
      goals: {type: new GraphQLList(GraphQLURL)},
    },
    async resolve(source, {playerId, goals}, {rootValue: {currentUser}}) {
      // only players can vote
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      // if no playerId was passed, assume the currentUser
      try {
        const player = await r.table('players')
          .get(playerId ? playerId : currentUser.id)
          .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
          .without('chapterId')
          .run()
        if (!player) {
          throw new GraphQLError('You are not a player in the game.')
        }

        // find the cycle to which this vote belongs, which is the cycle that
        // has the earliest `startTimestamp` of all of the ones that correspond
        // to this chapter and are in the `GOAL_SELECTION` state
        const now = r.now()
        const cycles = await r.table('cycles')
          .getAll([player.chapter.id, 'GOAL_SELECTION'], {index: 'chapterIdAndState'})
          .orderBy('startTimestamp')
          .run()
        if (!cycles.length > 0) {
          throw new GraphQLError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in GOAL_SELECTION state.`)
        }
        const cycle = cycles[0]

        // ensure that the goals being voted on are appropriate for this chapter
        goals.forEach(goal => {
          if (goal.indexOf(`${player.chapter.goalRepositoryURL}/issues`) < 0) {
            throw new GraphQLError(`Goal ${goal} not from the goal library ${player.chapter.goalRepositoryURL}`)
          }
        })

        // see if the player has already voted to determine whether to insert
        // or update
        const playerVotes = await r.table('votes')
          .getAll([player.id, cycle.id], {index: 'playerIdAndCycleId'})
          .run()
        const playerVote = playerVotes.length > 0 ? playerVotes[0] : {
          playerId: player.id,
          cycleId: cycle.id,
          goals,
        }
        let voteWithTimestamps = Object.assign(playerVote, {updatedAt: now})
        let savedVote
        if (playerVote.id) {
          savedVote = await r.table('votes')
            .get(playerVote.id)
            .update(voteWithTimestamps, {returnChanges: 'always'})
            .run()
        } else {
          voteWithTimestamps = Object.assign(voteWithTimestamps, {createdAt: now})
          savedVote = await r.table('votes')
            .insert(voteWithTimestamps, {returnChanges: 'always'})
            .run()
        }

        if (savedVote.replaced || savedVote.inserted) {
          const returnedVote = Object.assign({}, savedVote.changes[0].new_val, {player, cycle})
          delete returnedVote.playerId
          delete returnedVote.cycleId
          return returnedVote
        }
        throw new GraphQLError('Could not save vote.')
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
}
