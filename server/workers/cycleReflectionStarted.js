import Promise from 'bluebird'

import {mapById} from 'src/common/util'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {Chapter, Moderator, Project} from 'src/server/services/dataService'
import ensureCycleReflectionSurveysExist from 'src/server/actions/ensureCycleReflectionSurveysExist'
import reloadDefaultModelData from 'src/server/actions/reloadDefaultModelData'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleReflectionStarted', processCycleReflectionStarted, notifyModeratorsAboutError)
}

async function processCycleReflectionStarted(cycle) {
  console.log(`Starting reflection for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  await reloadDefaultModelData()
  await ensureCycleReflectionSurveysExist(cycle)
  await _sendStartReflectionAnnouncement(cycle)

  console.log(`Cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId} reflection successfully started`)
}

async function _sendStartReflectionAnnouncement(cycle) {
  const announcement = `🤔  *Time to start your reflection process for cycle ${cycle.cycleNumber}*!\n`
  const reflectionInstructions = 'To get started check out `/retro --help`'

  const chapter = await Chapter.get(cycle.chapterId)
  await _createReflectionAnnoucements(chapter, cycle, announcement + reflectionInstructions)
}

async function notifyModeratorsAboutError(cycle, originalErr) {
  try {
    await _notifyModerators(cycle.chapterId, `❗️ **Error:** ${originalErr}`)
  } catch (err) {
    console.error(`Got this error [${err}] trying to notify moderators about this error [${originalErr}]`)
  }
}

async function _notifyModerators(chapterId, message) {
  const notificationService = require('src/server/services/notificationService')

  const chapterModerators = await Moderator.filter({chapterId})
  chapterModerators.forEach(moderator => (
    notificationService.notifyUser(moderator.id, message)
  ))
}

async function _createReflectionAnnoucements(chapter, cycle, message) {
  const chatService = require('src/server/services/chatService')
  const projects = await Project.filter({chapterId: cycle.chapterId, cycleId: cycle.id})

  // get all user info from IDM in one fell swoop
  const allPlayerIds = projects.reduce((result, project) => {
    result = result.concat(project.playerIds)
    return result
  }, [])
  const allUsersById = mapById(
    await getPlayerInfo(allPlayerIds)
  )

  const dmPromises = projects.map(project => {
    const handles = project.playerIds.map(playerId => allUsersById.get(playerId).handle)
    return chatService.sendDirectMessage(handles, message)
  })

  return Promise.all([
    chatService.sendChannelMessage(chapter.channelName, message),
    ...dmPromises,
  ])
}
