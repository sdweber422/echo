import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {resolveUser} from 'src/server/graphql/resolvers'
import {UserSummary} from 'src/server/graphql/schemas'

export default {
  type: UserSummary,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'The user ID or handle'},
  },
  async resolve(source, args, ast) {
    if (!userCan(ast.rootValue.currentUser, 'viewUserSummary')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    return {
      user: await resolveUser(source, args, ast),
    }
  }
}
