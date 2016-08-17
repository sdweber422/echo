import {GraphQLError} from 'graphql/error'
import {GraphQLList} from 'graphql/type'

import {handleError} from 'src/server/graphql/models/util'
import {getLatestCycleForChapter} from 'src/server/db/cycle'
import {getPlayerById} from 'src/server/db/player'
import {getModeratorById} from 'src/server/db/moderator'
import {
  getProjectsForChapterInCycle,
  getProjectsForPlayer,
  findProjectsAndReviewResponsesForPlayer,
} from 'src/server/db/project'

import {ProjectWithReviewResponses, ProjectsSummary} from './schema'

export default {
  getProjectSummaryForPlayer: {
    type: ProjectsSummary,
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const user = (
          await getPlayerById(currentUser.id, {mergeChapter: true}) ||
          await getModeratorById(currentUser.id, {mergeChapter: true})
        )
        const cycle = await getLatestCycleForChapter(user.chapter.id)

        const numActiveProjectsForCycle = await getProjectsForChapterInCycle(user.chapter.id, cycle.id).count()
        const numTotalProjectsForPlayer = await getProjectsForPlayer(user.id).count()

        return {numActiveProjectsForCycle, numTotalProjectsForPlayer}
      } catch (err) {
        handleError(err)
      }
    },
  },
  getProjectsAndReviewResponsesForPlayer: {
    type: new GraphQLList(ProjectWithReviewResponses),
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const user = (
          await getPlayerById(currentUser.id, {mergeChapter: true}) ||
          await getModeratorById(currentUser.id, {mergeChapter: true})
        )
        const cycle = await getLatestCycleForChapter(user.chapter.id)

        const projects = await findProjectsAndReviewResponsesForPlayer(user.chapter.id, cycle.id, user.id)
        return projects
      } catch (err) {
        handleError(err)
      }
    },
  },
}
