/* eslint-disable prefer-arrow-callback */
import Promise from 'bluebird'
import logger from 'src/server/util/logger'
import generateProjectName from 'src/server/actions/generateProjectName'
import sendCycleLaunchAnnouncement from 'src/server/actions/sendCycleLaunchAnnouncement'
import {formProjectsIfNoneExist} from 'src/server/actions/formProjects'
import {getGoalInfo} from 'src/server/services/goalLibraryService'
import {Moderator, Phase, Player, Project} from 'src/server/services/dataService'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleLaunched', processCycleLaunched, _handleCycleLaunchError)
}

export async function processCycleLaunched(cycle) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  const handlePFAError = err => _notifyModerators(cycle, `⚠️ ${err.message}`)
  const votingProjects = await formProjectsIfNoneExist(cycle.id, handlePFAError)
  console.log(`${votingProjects.length} project(s) created for all voting phases`)

  const nonVotingProjects = await _createProjectsInCycleForNonVotingPhases(cycle)
  console.log(`${nonVotingProjects.length} project(s) created for all non-voting phases`)

  await _sendCycleLaunchAnnouncements(cycle)
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

async function _createProjectsInCycleForNonVotingPhases(cycle) {
  console.log('Automatically creating projects for non-voting phases')

  const nonVotingPhases = await Phase.filter({hasVoting: false}).hasFields('practiceGoalNumber')
  if (nonVotingPhases.length === 0) {
    console.log('No non-voting phases found; skipped')
    return []
  }

  let newPhaseProjects = []
  await Promise.each(nonVotingPhases, async phase => {
    const existingProjects = await Project.filter({cycleId: cycle.id, phaseId: phase.id})
    if (existingProjects.length > 0) {
      console.log('Existing projects found for non-voting phase; skipped')
      return
    }

    const players = await Player.filter({phaseId: phase.id})
    if (players.length === 0) {
      console.log(`No players found in Phase ${phase.number}; skipped`)
      return
    }

    const goal = await getGoalInfo(phase.practiceGoalNumber)

    const projects = await Promise.map(players, async player => ({
      name: await generateProjectName(),
      chapterId: cycle.chapterId,
      cycleId: cycle.id,
      phaseId: phase.id,
      playerIds: [player.id],
      goal,
    }), {concurrency: 5})

    const savedProjects = await Project.save(projects)

    console.log(`${savedProjects.length} project(s) automatically created for Phase ${phase.number}`)

    newPhaseProjects = newPhaseProjects.concat(savedProjects)
  })

  return newPhaseProjects
}

async function _sendCycleLaunchAnnouncements(cycle) {
  const votingPhases = await Phase.filter({hasVoting: true})
  return Promise.each(votingPhases, async phase => {
    try {
      await sendCycleLaunchAnnouncement(cycle, phase)
    } catch (err) {
      logger.warn(`Failed to send cycle launch announcement to Phase ${phase.number} members for cycle ${cycle.cycleNumber}: ${err}`)
    }
  })
}
