import {GraphQLList} from 'graphql/type'

import {findPlayersWithChaptersSafe} from 'src/server/services/dataService'
import {User} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(User),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    return findPlayersWithChaptersSafe()
  },
}
