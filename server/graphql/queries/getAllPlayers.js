import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {connect} from 'src/db'
import {User} from 'src/server/graphql/schemas'
import {handleError} from 'src/server/graphql/util'

const r = connect()

export default {
  type: new GraphQLList(User),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const result = await r.table('players')
      .eqJoin('chapterId', r.table('chapters'))
      .without({left: 'chapterId'}, {right: 'inviteCodes'})
      .map(doc => doc('left').merge({chapter: doc('right')}))
      .run()
      .catch(handleError)

    return result
  },
}
