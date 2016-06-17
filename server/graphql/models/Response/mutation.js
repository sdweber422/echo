import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList, GraphQLObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import saveRetrospectiveCLISurveyResponseForPlayer from '../../../../server/actions/saveRetrospectiveCLISurveyResponseForPlayer'

import {CLISurveyResponse} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

const CreatedIdList = new GraphQLObjectType({
  name: 'CreatedIdList',
  description: 'A list of the IDs created by this request',
  fields: {
    createdIds: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLID))
    }
  }
})

export default {
  saveRetrospectiveCLISurveyResponse: {
    type: CreatedIdList,
    args: {
      response: {
        description: 'A list of responses to save',
        type: new GraphQLNonNull(CLISurveyResponse)
      },
    },
    resolve(source, {response}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return saveRetrospectiveCLISurveyResponseForPlayer(currentUser.id, response)
        .then(createdIds => ({createdIds}))
        .catch(err => {
          if (err.name === 'BadInputError') {
            throw err
          }
          console.error(err.stack)
          sentry.captureException(err)
          throw new GraphQLError('Failed to save responses')
        })
    }
  },
}
