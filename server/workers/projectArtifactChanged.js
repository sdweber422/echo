import ChatClient from 'src/server/clients/ChatClient'
import {getQueue} from 'src/server/util/queue'

export function start() {
  const projectArtifactChanged = getQueue('projectArtifactChanged')
  projectArtifactChanged.process(({data: project}) => processProjectArtifactChange(project))
}

export async function processProjectArtifactChange(project, chatClient = new ChatClient()) {
  console.log(`Project artifact for project #${project.name} changed to ${project.artifactURL}`)
  await sendProjectArtifactChangedAnnouncement(project, chatClient)
}

function sendProjectArtifactChangedAnnouncement(project, chatClient) {
  const announcement = `🔗 * The [artifact](${project.artifactURL}) for #${project.name} has been updated*.`
  return chatClient.sendChannelMessage(project.name, announcement)
}
