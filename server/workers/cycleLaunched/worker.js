/* eslint-disable prefer-arrow-callback */
import Promise from 'bluebird'
import logger from 'src/server/util/logger'
import initializeProject from 'src/server/actions/initializeProject'
import sendCycleLaunchAnnouncement from 'src/server/actions/sendCycleLaunchAnnouncement'
import {formProjectsIfNoneExist} from 'src/server/actions/formProjects'
import {Moderator} from 'src/server/services/dataService'
import {getQueue} from 'src/server/services/queueService'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleLaunched', processCycleLaunched, _handleCycleLaunchError)
}

export async function processCycleLaunched(cycle, options) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  const handlePFAError = err => _notifyModerators(cycle, `⚠️ ${err.message}`)
  const projects = await formProjectsIfNoneExist(cycle.id, handlePFAError)
  if (!projects || projects.length === 0) {
    console.warn(`No new projects formed for cycle ${cycle.cycleNumber}; cycle launch aborted`)
    return
  }

  await Promise.each(projects, async project => {
    try {
      await initializeProject(project, options)
    } catch (err) {
      logger.error(`Error initializing project #${project.name}:`, err)
    }
  })

  triggerProjectFormationCompleteEvent(cycle)

  return sendCycleLaunchAnnouncement(cycle, projects)
    .catch(err => logger.warn(`Failed to send cycle launch announcement for cycle ${cycle.cycleNumber}: ${err}`))
}

async function _handleCycleLaunchError(cycle, err) {
  console.log(`Notifying moderators of chapter ${cycle.chapterId} of cycle launch error`)
  await _notifyModerators(cycle, `❗️ **Cycle Launch Error:** ${err.message}`)
}

async function _notifyModerators(cycle, message) {
  const notificationService = require('src/server/services/notificationService')

  try {
    const chapterModerators = await Moderator.filter({chapterId: cycle.chapterId})
    chapterModerators.forEach(moderator => (
      notificationService.notifyUser(moderator.id, message)
    ))
  } catch (err) {
    console.error('Moderator notification error:', err)
  }
}

function triggerProjectFormationCompleteEvent(cycle) {
  const queue = getQueue('projectFormationComplete')
  queue.add(cycle, {
    attempts: 3,
    backoff: {type: 'fixed', delay: 10000},
  })
}
