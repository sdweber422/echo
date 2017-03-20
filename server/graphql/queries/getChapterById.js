import {GraphQLNonNull, GraphQLID} from 'graphql'

import {connect} from 'src/db'
import {Chapter} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadInputError} from 'src/server/util/error'

const r = connect()

export default {
  type: Chapter,
  args: {
    id: {type: new GraphQLNonNull(GraphQLID)}
  },
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const result = await r.table('chapters').get(args.id).run()
    if (result) {
      return result
    }

    throw new LGBadInputError('No such chapter')
  }
}
