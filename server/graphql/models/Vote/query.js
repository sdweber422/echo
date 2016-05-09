import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'

import {CycleVotingResults} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getCycleVotingResults: {
    type: CycleVotingResults,
    args: {
      cycleId: {type: new GraphQLNonNull(GraphQLID)},
    },
    async resolve(source, args) {
      try {
        const cycle = await r.table('cycles').get(args.cycleId).run()
        const numEligiblePlayers = await r.table('players')
          .getAll(cycle.chapterId, {index: 'chapterId'})
          .count()
          .run()
        const numVotes = await r.table('votes')
          .getAll(args.cycleId, {index: 'cycleId'})
          .count()
          .run()
        const candidateGoals = await r.table('votes')
          .getAll(args.cycleId, {index: 'cycleId'})
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
          cycleState: cycle.state,
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
