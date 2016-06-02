import raven from 'raven'

import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList, GraphQLObjectType} from 'graphql/type'
import {GraphQLError} from 'graphql/error'
import {InputResponse} from './schema'
import {userCan} from '../../../../common/util'
import {saveResponsesForQuestion} from '../../../../server/db/response'

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
  saveResponses: {
    type: CreatedIdList,
    args: {
      responses: {
        description: 'A list of responses to save',
        type: new GraphQLNonNull(new GraphQLList(InputResponse))
      },
    },
    resolve(source, {responses}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return saveResponsesForQuestion(responses)
        .then(createdIds => ({createdIds}))
        .catch(err => {
          console.error(err)
          sentry.captureException(err)
          throw new GraphQLError('Failed to save responses')
        })
    }
  },
}
