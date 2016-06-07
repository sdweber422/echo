import raven from 'raven'

import {userCan} from '../../../../common/util'
import {GraphQLError, locatedError} from 'graphql/error'
import {Survey} from './schema'
import {getCurrentRetrospectiveSurveyForPlayerDeeply} from '../../../../server/db/survey'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getRetrospectiveSurvey: {
    type: Survey,
    args: {},
    resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return getCurrentRetrospectiveSurveyForPlayerDeeply(currentUser.id)
        .catch(err => {
          console.log(err.stack)
          sentry.captureException(err)
          throw locatedError(err)
        })
    },
  },
}
