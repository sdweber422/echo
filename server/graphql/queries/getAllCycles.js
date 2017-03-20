import {GraphQLList} from 'graphql/type'

import {connect} from 'src/db'
import {Cycle} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

const r = connect()

export default {
  type: new GraphQLList(Cycle),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const result = await r.table('cycles')
      .eqJoin('chapterId', r.table('chapters'))
      .without({left: 'chapterId'}, {right: 'inviteCodes'})
      .map(doc => doc('left').merge({chapter: doc('right')}))
      .run()

    return result
  },
}
