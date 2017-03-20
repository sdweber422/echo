import {GraphQLList} from 'graphql/type'

import {getLatestCycleForChapter} from 'src/server/db/cycle'
import {getUserById} from 'src/server/db/user'
import {findProjectsAndReviewResponsesForPlayer} from 'src/server/db/project'
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
