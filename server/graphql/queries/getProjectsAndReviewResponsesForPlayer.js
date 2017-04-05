import {GraphQLList} from 'graphql/type'

import {
  getLatestCycleForChapter,
  getUserById,
  findProjectsAndReviewResponsesForPlayer,
} from 'src/server/services/dataService'
import {ProjectWithReviewResponses} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(ProjectWithReviewResponses),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const user = await getUserById(currentUser.id, {mergeChapter: true})
    const cycle = await getLatestCycleForChapter(user.chapter.id)

    return await findProjectsAndReviewResponsesForPlayer(user.chapter.id, cycle.id, user.id)
  },
}
