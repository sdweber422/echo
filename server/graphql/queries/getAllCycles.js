import {GraphQLList} from 'graphql/type'

import {findCyclesWithChaptersSafe} from 'src/server/services/dataService'
import {Cycle} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Cycle),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    return findCyclesWithChaptersSafe()
  },
}
