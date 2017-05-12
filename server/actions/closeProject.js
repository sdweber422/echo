import Promise from 'bluebird'

import {Player, Project} from 'src/server/services/dataService'
import {CLOSED, CLOSED_FOR_REVIEW, TRUSTED_PROJECT_REVIEW_START_DATE} from 'src/common/models/project'
import {getStatResponsesBySubjectId} from 'src/server/services/surveyService'
import findClosedProjectsReviewedByUser from 'src/server/actions/findClosedProjectsReviewedByUser'
import updatePlayerStatsForProject from 'src/server/actions/updatePlayerStatsForProject'
import {
  calculateProjectReviewStats,
  calculateProjectReviewStatsForPlayer,
} from 'src/server/util/stats'
import {unique, mapById} from 'src/common/util'

export default async function closeProject(projectOrId, {updateClosedAt = true} = {}) {
  const project = (typeof projectOrId === 'string') ?
    await Project.get(projectOrId) : projectOrId

  if (project.state !== CLOSED_FOR_REVIEW) {
    await Project.get(project.id).updateWithTimestamp({state: CLOSED_FOR_REVIEW})
  }

  const closedAttrs = {id: project.id, state: CLOSED}
  if (updateClosedAt) {
    closedAttrs.closedAt = new Date()
  }

  const stats = await _calculateStatsFromReviews(project)
  const updatedProject = await Project.get(project.id).updateWithTimestamp({stats})
  await _updateReviewStatsForProjectReviewers({...updatedProject, ...closedAttrs})
  await updatePlayerStatsForProject(updatedProject)

  await Project.get(project.id).updateWithTimestamp(closedAttrs)
}

async function _updateReviewStatsForProjectReviewers(project) {
  const statResponses = await getStatResponsesBySubjectId(project.id)
  const playerIds = unique(statResponses.map(_ => _.respondentId))
  const playersById = mapById(await Player.getAll(...playerIds))

  await Promise.each(playersById, async ([playerId, player]) => {
    const pastReviewedProjects = await findClosedProjectsReviewedByUser(player.id, {
      before: project.closedAt,
      since: TRUSTED_PROJECT_REVIEW_START_DATE,
    })
    const projects = [...pastReviewedProjects, project]

    const projectReviewInfoList = await Promise.mapSeries(projects, async project => ({
      project,
      projectReviews: await _getProjectReviewsForProject(project)
    }))

    const stats = calculateProjectReviewStatsForPlayer(player, projectReviewInfoList)

    await Player.get(playerId).updateWithTimestamp({stats}) // partial top-level stats update
  })
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
