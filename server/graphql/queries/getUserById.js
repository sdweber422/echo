import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getUserById} from 'src/server/db/user'
import {User} from 'src/server/graphql/schemas'

export default {
  type: User,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)},
  },
  async resolve(source, {id}, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const result = await getUserById(id, {mergeChapter: true})
    if (result) {
      return result
    }
    throw new GraphQLError('No such user')
  }
}
