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

// FIXME: hardcoded, yuck
const PRO_PLAYER_RATING = 1300
const PRO_PLAYER_IDS = {
  '070b3063-0ff7-40c6-b3d1-321fa49b6c94': 'bluemihai',
  '75dbe257-a701-4725-ba74-4341376f540d': 'jrob8577',
  'dcf14075-6fbe-44ab-89bf-cba2511f0278': 'deadlyicon',
  '3760fbe8-2c2e-46d9-bca7-a9610dc0d417': 'prattsj',
  'ed958f6f-1870-4ba9-8de9-e1092c9fa758': 'deonna',
}

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []

  const players = await findPlayers()
  await Promise.each(players, player => {
    return clearPlayerStats(player)
  })

  const proPlayerStats = {elo: {rating: PRO_PLAYER_RATING}}
  const proPlayers = players.filter(player => PRO_PLAYER_IDS[player.id])
  await Promise.each(proPlayers, proPlayer => {
    return setPlayerStats(proPlayer, proPlayerStats)
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

async function setPlayerStats(player, stats) {
  console.log(LOG_PREFIX, `Setting stats for player ${player.id}`)

  await getPlayerById(player.id)
    .update({stats})
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
