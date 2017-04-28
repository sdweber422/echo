import {mapById} from 'src/common/util'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {notifyCoachIfReviewIsOpen} from 'src/server/workers/util'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectArtifactChanged', processProjectArtifactChanged)
}

export async function processProjectArtifactChanged(project) {
  const chatService = require('src/server/services/chatService')

  console.log(`Project artifact for project #${project.name} changed to ${project.artifactURL}`)
  const projectUsersById = mapById(
    await getPlayerInfo(project.playerIds)
  )
  const handles = project.playerIds.map(playerId => projectUsersById.get(playerId).handle)

  const announcement = `🔗 * The <${project.artifactURL}|artifact> for #${project.name} has been updated*.`

  await notifyCoachIfReviewIsOpen(project)
  return chatService.sendDirectMessage(handles, announcement)
}
