import {Survey} from 'src/server/services/dataService'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectReviewStarted', processProjectReviewStarted)
}

export async function processProjectReviewStarted(project) {
  await _notifyCoachOfProjectStateChange(project)
}

async function _notifyCoachOfProjectStateChange(project) {
  const chatService = require('src/server/services/chatService')
  const reviewSurvey = await Survey.get(project.projectReviewSurveyId)
  const coach = (await getPlayerInfo(project.coachId))[0]

  if (reviewSurvey.completedBy.includes(coach.id)) {
    return
  }
  return chatService.sendDirectMessage(coach.handle, `Project ${project.name} is now ready to be reviewed.`)
}
