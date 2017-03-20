import {GraphQLList} from 'graphql'

import {connect} from 'src/db'
import {Chapter} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

const r = connect()

export default {
  type: new GraphQLList(Chapter),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    return await r.table('chapters').run()
  }
}
