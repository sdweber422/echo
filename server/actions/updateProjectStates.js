import Promise from 'bluebird'
import closeProject from 'src/server/actions/closeProject'
import {Project, Response} from 'src/server/services/dataService'
import {
  PROJECT_STATES,
  PROJECT_REVIEW_TIMEOUT_MS,
  PROJECT_ABANDON_TIMEOUT_MS,
} from 'src/common/models/project'
import {connect} from 'src/db'

const r = connect()

const {
  REVIEW,
  ABANDONED,
} = PROJECT_STATES

export default async function updateProjectStates() {
  const projectsInReview = await Project.filter({state: REVIEW})
  return Promise.map(projectsInReview, _updateProjectState)
}

async function _updateProjectState(project) {
  const lastExternalReviewDate = await _getMostRecentExternalReviewDate(project)
  const now = Date.now()

  if (!lastExternalReviewDate) {
    const reviewStartedAt = project.reviewStartedAt.getTime()
    const timeInReview = now - reviewStartedAt

    if (timeInReview > PROJECT_ABANDON_TIMEOUT_MS) {
      return await Project.get(project.id).update({state: ABANDONED, updatedAt: r.now()})
    }
    return
  }

  if (lastExternalReviewDate.getTime() + PROJECT_REVIEW_TIMEOUT_MS < now) {
    return await closeProject(project.id)
  }
}

async function _getMostRecentExternalReviewDate(project) {
  const responses = await Response
    .filter(_isExternalReview(project))
    .orderBy(r.desc('updatedAt'))

  return responses[0] && responses[0].updatedAt
}

function _isExternalReview(project) {
  return response => r.not(
    r.expr(project.playerIds).contains(response('respondentId'))
  )
}
