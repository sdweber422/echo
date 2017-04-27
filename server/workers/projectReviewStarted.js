import {Survey} from 'src/server/services/dataService'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectReviewStarted', processProjectReviewStarted)
}

export async function processProjectReviewStarted(project) {
  const coach = (await getPlayerInfo(project.coachId))[0]

  await _notifyCoachOfProjectStateChange(project, coach)
  await _notifyPlayersIfReviewIsBlocked(project, coach)
}

async function _notifyCoachOfProjectStateChange(project, coach) {
  const chatService = require('src/server/services/chatService')
  const reviewSurvey = await Survey.get(project.projectReviewSurveyId)

  if (reviewSurvey.completedBy.includes(coach.id)) {
    return
  }
  return chatService.sendDirectMessage(coach.handle, `Project ${project.name} is now ready to be reviewed.`)
}

async function _notifyPlayersIfReviewIsBlocked(project, coach) {
  const chatService = require('src/server/services/chatService')
  const playerHandles = (await getPlayerInfo(project.playerIds)).map(player => player.handle)

  if (!project.artifactURL) {
    chatService.sendDirectMessage(playerHandles, `An artifact still needs to be set for project ${project.name}. Your coach cannot submit a review without a project artifact.`)
    chatService.sendDirectMessage(coach.handle, `Review will be blocked for project ${project.name} until a player sets the project artifact.`)
  }
}
