import raven from 'raven'
import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import config from 'src/config'
import {connect} from 'src/db'
import {Chapter} from 'src/server/graphql/schemas'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

export default {
  type: Chapter,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    try {
      if (!currentUser) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const result = await r.table('chapters').get(args.id).run()
      if (result) {
        return result
      }
      throw new GraphQLError('No such chapter')
    } catch (err) {
      sentry.captureException(err)
      throw err
    }
  }
}
