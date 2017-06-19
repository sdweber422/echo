import {COMPLETE} from 'src/common/models/cycle'
import logger from 'src/server/util/logger'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {LGBadRequestError} from 'src/server/util/error'

export default async function initializeProject(project) {
  const {Cycle, Project} = require('src/server/services/dataService')

  project = typeof project === 'string' ? await Project.get(project).getJoin({cycle: true}) : project
  if (!project) {
    throw new LGBadRequestError(`Project ${project} not found; initialization aborted`)
  }

  const cycle = project.cycle || (await Cycle.get(project.cycleId))
  if (cycle.state === COMPLETE) {
    console.log(`Project initialization skipped for ${project.name}; cycle ${cycle.cycleNumber} is complete.`)
  }

  logger.log(`Initializing project #${project.name}`)
  await _initializeProjectGoalChannel(project)
}

async function _initializeProjectGoalChannel(project) {
  const chatService = require('src/server/services/chatService')

  const {goal} = project
  const players = await getPlayerInfo(project.playerIds)
  const playerHandles = players.map(p => p.handle)

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
