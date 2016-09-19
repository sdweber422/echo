/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const updateProjectCycleStats = require('src/server/actions/updateProjectStats')
const {findPlayers, getPlayerById} = require('src/server/db/player')
const {findChapters} = require('src/server/db/chapter')
const {getCyclesForChapter} = require('src/server/db/cycle')
const {getProjectsForChapterInCycle} = require('src/server/db/project')
const {COMPLETE} = require('src/common/models/cycle')
const {finish} = require('./util')

const LOG_PREFIX = '[runStats]'

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []

  const players = await findPlayers()
  await Promise.each(players, player => {
    return clearPlayerStats(player)
  })

  const chapters = await findChapters()
  await Promise.each(chapters, chapter => {
    return updateChapterStats(chapter).catch(err => {
      errors.push(err)
    })
  })

  if (errors.length) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.error('\n', err))
    throw new Error('Stats computation failed')
  }
}

async function clearPlayerStats(player) {
  console.log(LOG_PREFIX, `Clearing stats for player ${player.id}`)

  await getPlayerById(player.id)
    .replace(player => player.without('stats'))
    .run()
}

async function updateChapterStats(chapter) {
  console.log(LOG_PREFIX, `Updating stats for chapter ${chapter.name} (${chapter.id})`)

  const chapterCycles = await getCyclesForChapter(chapter.id)
  const chapterCyclesSorted = chapterCycles.sort((a, b) => a.cycleNumber - b.cycleNumber)

  return Promise.each(chapterCyclesSorted, cycle => {
    if (cycle.state !== COMPLETE) {
      console.log(LOG_PREFIX, `Skipping cycle ${cycle.id} in state ${cycle.state}`)
      return
    }
    return updateChapterCycleStats(chapter, cycle)
  })
}

async function updateChapterCycleStats(chapter, cycle) {
  console.log(LOG_PREFIX, `Updating stats for cycle ${cycle.cycleNumber} (${cycle.id})`)

  const cycleProjects = await getProjectsForChapterInCycle(chapter.id, cycle.id)
  return Promise.each(cycleProjects, project => {
    return updateCycleProjectStats(cycle, project)
  })
}

function updateCycleProjectStats(cycle, project) {
  console.log(LOG_PREFIX, `Updating stats for project ${project.name} (${project.id})`)

  const projectCycleHistory = (project.cycleHistory || []).find(ch => ch.cycleId === cycle.id)
  if (!projectCycleHistory) {
    console.warn(LOG_PREFIX, `Cycle history not found for project ${project.name} (${project.id})`)
    return
  }

  return updateProjectCycleStats(project, cycle.id)
}
