import raven from 'raven'

import {userCan} from '../../../../common/util'
import {GraphQLError} from 'graphql/error'
import {Survey} from './schema'
import {getCurrentRetrospectiveSurveyForPlayer} from '../../../../server/db/survey'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getRetrospectiveSurvey: {
    type: Survey,
    args: {},
    resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return getCurrentRetrospectiveSurveyForPlayer(currentUser.id)
        .then(result => {
          if (!result) {
            throw new GraphQLError('No Retrospective Survey Found')
          }
          result.project = {id: result.projectId}
          result.cycle = {id: result.cycleId}
          return result
        })
        .catch(err => {
          console.log(err.stack)
          sentry.captureException(err)
          throw err
        })
    },
  },
}
