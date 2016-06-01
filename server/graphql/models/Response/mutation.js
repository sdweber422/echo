// import raven from 'raven'

import {GraphQLNonNull} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'
import {InputResponse, Response} from './schema'
import {userCan} from '../../../../common/util'

// const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  saveResponses: {
    type: Response,
    args: {
      response: {
        description: 'A list of responses to save',
        type: new GraphQLNonNull(new GraphQLList(InputResponse))
      },
    },
    resolve(source, {response}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'saveResponse')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      throw new GraphQLError('Oops, this API is not implemented yet')
    }
  },
}
