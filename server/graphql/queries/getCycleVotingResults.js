import {GraphQLID} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {getPlayerById} from 'src/server/db/player'
import {getModeratorById} from 'src/server/db/moderator'
import {customQueryError} from 'src/server/db/errors'
import getCycleVotingResults from 'src/server/actions/getCycleVotingResults'
import {CycleVotingResults} from 'src/server/graphql/schemas'

export default {
  type: CycleVotingResults,
  args: {
    cycleId: {type: GraphQLID}
  },
  async resolve(source, {cycleId}, {rootValue: {currentUser}}) {
    // only signed-in users can view results
    if (!currentUser) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const user = await getPlayerById(currentUser.id)
      .default(
        getModeratorById(currentUser.id)
          .default(
            customQueryError('You are not a player or moderator in the game.')
          )
      )

    return await getCycleVotingResults(user.chapterId, cycleId)
  }
}
