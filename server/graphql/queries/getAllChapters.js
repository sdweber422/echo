import {GraphQLList} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {connect} from 'src/db'
import {Chapter} from 'src/server/graphql/schemas'

const r = connect()

export default {
  type: new GraphQLList(Chapter),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    return await r.table('chapters').run()
  }
}
