import {getLatestCycleForChapter} from 'src/server/db/cycle'
import {getUserById} from 'src/server/db/user'
import {findProjectsForUser, findProjects} from 'src/server/db/project'
import {ProjectsSummary} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: ProjectsSummary,
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const user = await getUserById(currentUser.id, {mergeChapter: true})
    const cycle = await getLatestCycleForChapter(user.chapter.id)

    const numActiveProjectsForCycle = await findProjects({chapterId: user.chapter.id, cycleId: cycle.id}).count()
    const numTotalProjectsForPlayer = await findProjectsForUser(user.id).count()

    return {numActiveProjectsForCycle, numTotalProjectsForPlayer}
  },
}
