import logger from 'src/server/util/logger'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {LGBadRequestError} from 'src/server/util/error'

export default async function initializeProject(project) {
  const {Project} = require('src/server/services/dataService')

  project = typeof project === 'string' ? await Project.get(project) : project
  if (!project) {
    throw new LGBadRequestError(`Project ${project} not found; initialization aborted`)
  }

  logger.log(`Initializing project #${project.name}`)

  return _initializeProjectGoalChannel(project)
}

async function _initializeProjectGoalChannel(project) {
  const chatService = require('src/server/services/chatService')

  const {goal} = project
  const players = await getPlayerInfo(project.playerIds)
  const playerHandles = players.map(p => p.handle)

  try {
    await chatService.sendDirectMessage(playerHandles, _welcomeMessage(project, goal, players))
  } catch (err) {
    logger.warn(err)
  }

  const goalChannelName = String(goal.number)
  const goalChannelTopic = goal.url
  try {
    await chatService.createChannel(goalChannelName)
    try {
      await chatService.setChannelTopic(goalChannelName, goalChannelTopic)
    } catch (err) {
      if (_isNotFoundError(err)) {
        console.log(`New channel ${goalChannelName} not found; attempting to set topic again`)
        await chatService.setChannelTopic(goalChannelName, goalChannelTopic)
      } else {
        console.error('Goal channel set topic error:', err)
        throw err
      }
    }
  } catch (err) {
    if (_isDuplicateChannelError(err)) {
      console.log(`Channel ${goalChannelName} already exists`)
    } else {
      console.error('Goal channel create error:', err)
      throw err
    }
  }

  await chatService.inviteToChannel(goalChannelName, playerHandles)
}

function _isDuplicateChannelError(error) {
  return (error.message || '').includes('name_taken')
}

function _isNotFoundError(error) {
  return (error.message || '').includes('channel_not_found')
}

function _welcomeMessage(project, goal, players) {
  const goalLink = `<${goal.url}|${goal.number}: ${goal.title}>`
  return `
🎊 *Welcome to the ${project.name} project!* 🎊

*Your goal is:* ${goalLink}

*Your team is:*
${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

>The first step is to create an appropriate project artifact.
>Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.`
}
