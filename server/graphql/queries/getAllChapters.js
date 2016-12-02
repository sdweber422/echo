import raven from 'raven'
import {GraphQLList} from 'graphql'
import {GraphQLError} from 'graphql/error'

import config from 'src/config'
import {connect} from 'src/db'
import {Chapter} from 'src/server/graphql/schemas'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

export default {
  type: new GraphQLList(Chapter),
  async resolve(source, args, {rootValue: {currentUser}}) {
    try {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return await r.table('chapters').run()
    } catch (err) {
      sentry.captureException(err)
      throw err
    }
  }
}
