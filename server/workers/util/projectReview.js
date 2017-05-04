import {Survey} from 'src/server/services/dataService'
import {REVIEW} from 'src/common/models/project'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export async function sendReviewNotificationToPlayers(project) {
  const chatService = require('src/server/services/chatService')

  if (!project.artifactURL) {
    const playerHandles = (await getPlayerInfo(project.playerIds)).map(p => p.handle)
    await chatService.sendDirectMessage(playerHandles, `Please set an artifact for project ${project.name} to enable reviews.`)
  }
}

export async function sendReviewNotificationToCoach(project) {
  const chatService = require('src/server/services/chatService')

  const projectIsReviewable = Boolean(project.state === REVIEW && project.projectReviewSurveyId && project.artifactURL && project.coachId)
  if (projectIsReviewable) {
    const coachHasAlreadyReviewed = (await Survey.get(project.projectReviewSurveyId)).completedBy.includes(project.coachId)
    if (!coachHasAlreadyReviewed) {
      const coach = (await getPlayerInfo([project.coachId]))[0]
      await chatService.sendDirectMessage(coach.handle, `Project ${project.name} is now ready to be reviewed.`)
    }
  }
}
