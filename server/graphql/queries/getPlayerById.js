import {GraphQLNonNull, GraphQLID} from 'graphql'

import {getPlayerById} from 'src/server/db/player'
import {User} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadRequestError} from 'src/server/util/error'

export default {
  type: User,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const result = await getPlayerById(args.id, {mergeChapter: true})
    if (result) {
      return result
    }

    throw new LGBadRequestError('No such player')
  },
}
