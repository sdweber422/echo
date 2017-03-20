import {GraphQLNonNull, GraphQLID} from 'graphql'

import {getUserById} from 'src/server/db/user'
import {User} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadInputError} from 'src/server/util/error'

export default {
  type: User,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)},
  },
  async resolve(source, {id}, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const result = await getUserById(id, {mergeChapter: true})
    if (result) {
      return result
    }
    throw new LGBadInputError('No such user')
  }
}
