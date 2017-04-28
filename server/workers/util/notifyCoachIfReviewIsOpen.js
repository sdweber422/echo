import {Survey} from 'src/server/services/dataService'
import {REVIEW} from 'src/common/models/project'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export default async function notifyCoachIfReviewIsOpen(project) {
  const projectReviewIsOpen = await _assertProjectReviewIsOpen(project)

  if (projectReviewIsOpen) {
    return _notifyCoach(project)
  }
}

async function _assertProjectReviewIsOpen(project) {
  return (
    _assertProjectIsReviewable(project) &&
    (await _assertCoachHasNotAlreadyReviewed(project))
  )
}

function _assertProjectIsReviewable(project) {
  if (!project.coachId || !project.artifactURL || project.state !== REVIEW) {
    return false
  }
  return true
}

async function _assertCoachHasNotAlreadyReviewed(project) {
  const reviewSurvey = await Survey.get(project.projectReviewSurveyId)
  if (reviewSurvey.completedBy.includes(project.coachId)) {
    return false
  }
  return true
}

async function _notifyCoach(project) {
  const chatService = require('src/server/services/chatService')
  const coach = (await getPlayerInfo(project.coachId))[0]

  return chatService.sendDirectMessage(coach.handle, `Project ${project.name} is now ready to be reviewed.`)
}
