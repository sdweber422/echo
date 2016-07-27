import {GraphQLError} from 'graphql/error'
import {GraphQLList} from 'graphql/type'

import {handleError} from '../../../../server/graphql/models/util'

import {getLatestCycleForChapter} from '../../../db/cycle'
import {getPlayerById} from '../../../db/player'
import {
  getProjectsForChapterInCycle,
  getProjectsForPlayer,
  findProjectsAndReviewResponsesForPlayer,
} from '../../../db/project'

import {ProjectWithReviewResponses, ProjectsSummary} from './schema'

export default {
  getProjectSummaryForPlayer: {
    type: ProjectsSummary,
    async resolve(source, args, {rootValue: {currentUser}}) {
      try {
        if (!currentUser) {
          throw new GraphQLError('You are not authorized to do that.')
        }

        const player = await getPlayerById(currentUser.id, {mergeChapter: true})
        const cycle = await getLatestCycleForChapter(player.chapter.id)

        const numActiveProjectsForCycle = await getProjectsForChapterInCycle(player.chapter.id, cycle.id).count()
        const numTotalProjectsForPlayer = await getProjectsForPlayer(player.id).count()

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

        const player = await getPlayerById(currentUser.id, {mergeChapter: true})
        const cycle = await getLatestCycleForChapter(player.chapter.id)

        const projects = await findProjectsAndReviewResponsesForPlayer(player.chapter.id, cycle.id, player.id)
        return projects
      } catch (err) {
        handleError(err)
      }
    },
  },
}
