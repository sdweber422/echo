import {GraphQLInt} from 'graphql'

import {userCan} from 'src/common/util'
import {getModeratorById} from 'src/server/db/moderator'
import createNextCycleForChapter from 'src/server/actions/createNextCycleForChapter'
import {Cycle} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGForbiddenError} from 'src/server/util/error'

export default {
  type: Cycle,
  args: {
    projectDefaultExpectedHours: {type: GraphQLInt},
  },
  async resolve(source, {projectDefaultExpectedHours}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'createCycle')) {
      throw new LGNotAuthorizedError()
    }

    const moderator = await getModeratorById(currentUser.id)
    if (!moderator) {
      throw new LGNotAuthorizedError('You are not a moderator for the game.')
    }
    if (!moderator.chapterId) {
      throw new LGForbiddenError('You must be assigned to a chapter to start a new cycle.')
    }

    return await createNextCycleForChapter(moderator.chapterId, projectDefaultExpectedHours)
  }
}
