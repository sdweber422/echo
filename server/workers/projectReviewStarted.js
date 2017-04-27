import {Survey} from 'src/server/services/dataService'
import {REVIEW} from 'src/common/models/project'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectReviewStarted', processProjectReviewStarted)
}

export async function processProjectReviewStarted(project) {
  await _notifyPlayersIfReviewIsBlocked(project)
  await notifyCoachIfReviewIsOpen(project)
}

export async function notifyCoachIfReviewIsOpen(project) {
  const chatService = require('src/server/services/chatService')

  if (project.artifactURL && project.state === REVIEW) {
    const coach = (await getPlayerInfo(project.coachId))[0]
    const reviewSurvey = await Survey.get(project.projectReviewSurveyId)

    if (reviewSurvey.completedBy.includes(coach.id)) {
      return
    }
    return chatService.sendDirectMessage(coach.handle, `Project ${project.name} is now ready to be reviewed.`)
  }
}

async function _notifyPlayersIfReviewIsBlocked(project) {
  const chatService = require('src/server/services/chatService')
  const playerHandles = (await getPlayerInfo(project.playerIds)).map(player => player.handle)

  if (!project.artifactURL) {
    chatService.sendDirectMessage(playerHandles, `An artifact still needs to be set for project ${project.name}. Your coach cannot submit a review without a project artifact.`)
  }
}
