import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {CandidateGoal} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getCandidateGoals: {
    type: new GraphQLList(CandidateGoal),
    args: {
      cycleId: {type: new GraphQLNonNull(GraphQLID)},
    },
    async resolve(source, args) {
      try {
        return r.table('votes')
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
          .run()
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  }
}
