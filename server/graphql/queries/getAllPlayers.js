import {GraphQLList} from 'graphql/type'

import {connect} from 'src/db'
import {User} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

const r = connect()

export default {
  type: new GraphQLList(User),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    return await r.table('players')
      .eqJoin('chapterId', r.table('chapters'))
      .without({left: 'chapterId'}, {right: 'inviteCodes'})
      .map(doc => doc('left').merge({chapter: doc('right')}))
      .run()
  },
}
