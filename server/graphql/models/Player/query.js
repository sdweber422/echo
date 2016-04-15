import raven from 'raven'

import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {Player} from './schema'

import r from '../../../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getAllPlayers: {
    type: new GraphQLList(Player),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        return await r.table('players').run()
      } catch (err) {
        sentry.captureException(err)
        throw err
      }
    }
  },
}
