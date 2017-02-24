import {Player} from 'src/server/services/dataService'
import {getProjectById, updateProject} from 'src/server/db/project'
import {PROJECT_STATES} from 'src/common/models/project'
import {getStatResponsesBySubjectId} from 'src/server/services/surveyService'
import {calculateProjectReviewStats} from 'src/server/util/stats'
import {unique, mapById} from 'src/common/util'

const {
  CLOSED_FOR_REVIEW,
  CLOSED,
} = PROJECT_STATES

export default async function closeProject(projectId) {
  await updateProject({id: projectId, state: CLOSED_FOR_REVIEW}, {returnChanges: true})

  const project = await getProjectById(projectId)
  const stats = await _calculateStatsFromReviews(project)

  await updateProject({id: projectId, state: CLOSED, stats})
}

async function _calculateStatsFromReviews(project) {
  const projectReviews = await _getProjectReviews(project)
  const stats = calculateProjectReviewStats(project, projectReviews)
  return stats
}

async function _getProjectReviews(project) {
  const statResponses = await getStatResponsesBySubjectId(project.id)
  const playerIds = unique(statResponses.map(_ => _.respondentId))
  const playersById = mapById(await Player.getAll(...playerIds))

  const reviewsByPlayerId = statResponses.reduce((result, response) => {
    result[response.respondentId] = result[response.respondentId] || {
      player: playersById.get(response.respondentId),
      responses: {}
    }
    result[response.respondentId].responses[response.statDescriptor] = response.value
    return result
  }, {})

  return Object.values(reviewsByPlayerId)
}
