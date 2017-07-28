import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import {Phase} from 'src/server/services/dataService'
import {PhaseSummary} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(PhaseSummary),
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'listPhaseSummaries')) {
      throw new LGNotAuthorizedError()
    }

    const phases = await Phase.run()
    return phases.map(phase => ({phase}))
  }
}
