import raven from 'raven'

import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {Vote} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getAllVotes: {
    type: new GraphQLList(Vote),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await r.table('votes')
          .eqJoin('playerId', r.table('players'))
          .without({left: 'playerId'})
          .map(doc => doc('left').merge({player: doc('right')}))
          .eqJoin('cycleId', r.table('cycles'))
          .without({left: 'cycleId'})
          .map(doc => doc('left').merge({cycle: doc('right')}))
          .run()

        return result
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    },
  },
}
