import config from 'src/config'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {Player} from 'src/server/services/dataService'

export default async function sendRetroCompletedNotification(project) {
  const chatService = require('src/server/services/chatService')

  const projectPlayers = await Player.getAll(...project.playerIds)
  const projectPlayerUsers = await getPlayerInfo(project.playerIds)
  const players = _mergePlayerUsers(projectPlayers, projectPlayerUsers)

  return Promise.all(players.map(player => {
    const retroNotificationMessage = _compilePlayerNotificationMessage(player, project)

    return chatService.sendDirectMessage(player.handle, retroNotificationMessage).catch(err => {
      console.error(`\n\nThere was a problem while sending a retro notification to player @${player.handle}`)
      console.error('Error:', err, err.stack)
      console.error(`Message: "${retroNotificationMessage}"`)
    })
  }))
}

function _mergePlayerUsers(players, users) {
  const combined = new Map()

  players.forEach(player => combined.set(player.id, Object.assign({}, player)))

  users.forEach(user => {
    const values = combined.get(user.id)
    if (values) {
      combined.set(user.id, Object.assign({}, values, user))
    }
  })

  return Array.from(combined.values())
}

function _compilePlayerNotificationMessage(player, project) {
  return (
    `**RETROSPECTIVE COMPLETE:**

    [View Project: ${project.name}](${config.app.baseURL}/projects/${project.name})`
  )
}
