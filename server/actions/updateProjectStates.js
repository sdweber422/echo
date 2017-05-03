import Promise from 'bluebird'
import moment from 'moment-timezone'
import logger from 'src/server/util/logger'
import closeProject from 'src/server/actions/closeProject'
import {Project, Response, Survey} from 'src/server/services/dataService'
import {
  REVIEW,
  ABANDONED,
  PROJECT_REVIEW_TIMEOUT_MS,
  PROJECT_ABANDON_TIMEOUT_MS,
} from 'src/common/models/project'
import {connect} from 'src/db'

const r = connect()

export default async function updateProjectStates() {
  const projectsInReview = await Project.filter({state: REVIEW})
  await Promise.each(projectsInReview, _updateProjectState)
}

async function _updateProjectState(project) {
  logger.log(`Checking state for ${project.name} (${project.id})`)

  const retrosCompleted = project.retrospectiveSurveyId ?
    (await Survey.get(project.retrospectiveSurveyId)).completedBy.length :
    0
  if (retrosCompleted < project.playerIds.length) {
    return
  }

  const lastExternalReviewDate = await _getMostRecentExternalReviewDate(project)
  const now = Date.now()

  if (!lastExternalReviewDate) {
    const reviewStartedAt = project.reviewStartedAt.getTime()
    const timeInReview = now - reviewStartedAt

    if (timeInReview > PROJECT_ABANDON_TIMEOUT_MS) {
      logger.log(`Abandoning project ${project.name}`)
      return Project
        .get(project.id)
        .updateWithTimestamp({state: ABANDONED})
    }
    return
  }

  logger.log(
    `Last external review for ${project.name} was`,
    `${moment(lastExternalReviewDate).format('MM-DD-YYYY HH:MM:SS')}`
  )

  if (lastExternalReviewDate.getTime() + PROJECT_REVIEW_TIMEOUT_MS < now) {
    logger.log(`Closing project ${project.name}`)
    return await closeProject(project)
  }
}

async function _getMostRecentExternalReviewDate(project) {
  const responses = await Response
    .filter(_isExternalReviewFor(project))
    .orderBy(r.desc('updatedAt'))

  return responses[0] && responses[0].updatedAt
}

function _isExternalReviewFor(project) {
  return response => r.not(
    r.expr(project.playerIds).contains(response('respondentId'))
  ).and(
    response('subjectId').eq(project.id)
  )
}
