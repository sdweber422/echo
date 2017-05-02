import getPlayerInfo from 'src/server/actions/getPlayerInfo'

import {sendReviewNotificationToCoach} from './util/projectReview'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectArtifactChanged', processProjectArtifactChanged)
}

export async function processProjectArtifactChanged(project) {
  const chatService = require('src/server/services/chatService')

  console.log(`Project artifact for project #${project.name} changed to ${project.artifactURL}`)
  const message = `🔗 * The <${project.artifactURL}|artifact> for #${project.name} has been updated*.`
  const projectMemberHandles = (await getPlayerInfo(project.playerIds)).map(u => u.handle)
  await chatService.sendDirectMessage(projectMemberHandles, message)

  await sendReviewNotificationToCoach(project)
}
