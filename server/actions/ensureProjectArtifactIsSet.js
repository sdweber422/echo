import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export default async function ensureProjectArtifactIsSet(project) {
  const chatService = require('src/server/services/chatService')

  if (project.artifactURL) {
    return true
  }

  const playerInfo = await getPlayerInfo(project.playerIds)
  const playerHandles = playerInfo.map(_ => _.handle)

  const message = `⏰ *Your project artifact for \`${project.name}\` is still not set.* \n` +
    "> Please stop what you're doing and use the `/project set-artifact` command to set your artifact."

  await chatService.sendDirectMessage(playerHandles, message)

  return false
}
