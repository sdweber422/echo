import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getCycleById} from 'src/server/db/cycle'
import {Cycle} from 'src/server/graphql/schemas'

export default {
  type: Cycle,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const result = await getCycleById(args.id, {mergeChapter: true})

    return result
  },
}
