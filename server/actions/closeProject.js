import Promise from 'bluebird'
import {Player} from 'src/server/services/dataService'
import {getProjectById, updateProject} from 'src/server/db/project'
import {updatePlayer} from 'src/server/db/player'
import {PROJECT_STATES, TRUSTED_PROJECT_REVIEW_START_DATE} from 'src/common/models/project'
import {getStatResponsesBySubjectId} from 'src/server/services/surveyService'
import findProjectsReviewedByUser from 'src/server/actions/findProjectsReviewedByUser'
import {
  calculateProjectReviewStats,
  calculateProjectReviewStatsForPlayer,
} from 'src/server/util/stats'
import {unique, mapById} from 'src/common/util'

const {
  CLOSED_FOR_REVIEW,
  CLOSED,
} = PROJECT_STATES

export default async function closeProject(projectOrId, {updateClosedAt = true} = {}) {
  const project = (typeof projectOrId === 'string') ?
    await getProjectById(projectOrId) :
    projectOrId

  await updateProject({id: project.id, state: CLOSED_FOR_REVIEW})

  const stats = await _calculateStatsFromReviews(project)
  await updateProject({id: project.id, stats})
  await _updateReviewStatsForProjectReviewers({project})

  const closedAttrs = {id: project.id, state: CLOSED}
  if (updateClosedAt) {
    closedAttrs.closedAt = new Date()
  }

  await updateProject(closedAttrs)
}

async function _updateReviewStatsForProjectReviewers({project}) {
  const statResponses = await getStatResponsesBySubjectId(project.id)
  const playerIds = unique(statResponses.map(_ => _.respondentId))
  const playersById = mapById(await Player.getAll(...playerIds))

  await Promise.each(playersById, async ([playerId, player]) => {
    const projectReviewInfoList = await _getProjectReviewInfoListForPlayer(player, {before: project.closedAt})
    const stats = calculateProjectReviewStatsForPlayer(player, projectReviewInfoList)
    await updatePlayer({id: playerId, stats}, {returnChanges: true})
  })
}

async function _getProjectReviewInfoListForPlayer(player, {before} = {}) {
  const projects = await findProjectsReviewedByUser(player.id, {
    before,
    since: TRUSTED_PROJECT_REVIEW_START_DATE,
  })

  return Promise.mapSeries(projects, async project => ({
    project,
    projectReviews: await _getProjectReviewsForProject(project)
  }))
}

async function _calculateStatsFromReviews(project) {
  const projectReviews = await _getProjectReviewsForProject(project)
  return calculateProjectReviewStats(project, projectReviews)
}

async function _getProjectReviewsForProject(project) {
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
