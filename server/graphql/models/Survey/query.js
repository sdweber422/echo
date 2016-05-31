import raven from 'raven'

import {GraphQLError} from 'graphql/error'
import {Survey} from './schema'
import {getCurrentRetrospectiveSurvey} from '../../../../server/db/survey'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getRetrospectiveSurvey: {
    type: Survey,
    args: {},
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const result = await getCurrentRetrospectiveSurvey(currentUser.id)

        if (result) {
          return result
        }
        throw new GraphQLError('No such player')
      } catch (err) {
        console.log(err.stack)
        sentry.captureException(err)
        throw err
      }
    },
  },
}
