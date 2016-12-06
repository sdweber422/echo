import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getPlayerById} from 'src/server/db/player'
import {User} from 'src/server/graphql/schemas'

export default {
  type: User,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const result = await getPlayerById(args.id, {mergeChapter: true})
    if (result) {
      return result
    }

    throw new GraphQLError('No such player')
  },
}
