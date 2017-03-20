import {GraphQLNonNull, GraphQLID} from 'graphql'

import {getCycleById} from 'src/server/db/cycle'
import {Cycle} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: Cycle,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const result = await getCycleById(args.id, {mergeChapter: true})

    return result
  },
}
