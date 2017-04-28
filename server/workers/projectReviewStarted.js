import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {notifyCoachIfReviewIsOpen} from './util'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectReviewStarted', processProjectReviewStarted)
}

export async function processProjectReviewStarted(project) {
  await Promise.all([
    _notifyPlayersIfReviewIsBlocked(project),
    notifyCoachIfReviewIsOpen(project),
  ])
}

async function _notifyPlayersIfReviewIsBlocked(project) {
  const chatService = require('src/server/services/chatService')
  const playerHandles = (await getPlayerInfo(project.playerIds)).map(player => player.handle)

  if (!project.artifactURL) {
    chatService.sendDirectMessage(playerHandles, `Please set an artifact for project ${project.name} to enable reviews.`)
  }
}
