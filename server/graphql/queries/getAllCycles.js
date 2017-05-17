import {GraphQLList} from 'graphql/type'

import {Cycle} from 'src/server/services/dataService'
import {Cycle as CycleSchema} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(CycleSchema),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    return Cycle.getJoin({chapter: true})
      .without({chapter: {inviteCodes: true}})
      .execute()
  },
}
