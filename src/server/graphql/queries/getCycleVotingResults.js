import {GraphQLID} from 'graphql'

import assertUserIsMember from 'src/server/actions/assertUserIsMember'
import getCycleVotingResults from 'src/server/actions/getCycleVotingResults'
import {CycleVotingResults} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: CycleVotingResults,
  args: {
    cycleId: {type: GraphQLID}
  },
  async resolve(source, {cycleId}, {rootValue: {currentUser}}) {
    // only signed-in users can view results
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const member = await assertUserIsMember(currentUser.id)
    return getCycleVotingResults(member.chapterId, cycleId)
  }
}
