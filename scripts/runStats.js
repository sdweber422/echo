/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const updatePlayerStatsForProject = require('src/server/actions/updatePlayerStatsForProject')
const updateProjectStats = require('src/server/actions/updateProjectStats')
const {STAT_DESCRIPTORS} = require('src/common/models/stat')
const {COMPLETE} = require('src/common/models/cycle')
const {
  Chapter,
  Player,
  Project,
  findCyclesForChapter,
} = require('src/server/services/dataService')
const {finish} = require('./util')

const {
  ELO,
} = STAT_DESCRIPTORS

const LOG_PREFIX = '[runStats]'

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []

  // clear player & project stats
  await Player.replace(row => row.without('stats'))
  await Project.replace(row => row.without('stats'))

  await Player
    .hasFields('statsBaseline')
    .updateWithTimestamp(_ => ({stats: _('statsBaseline')}))

  // calculate stats for each player in each project in each cycle in each chapter
  const chapters = await Chapter.run()
  await Promise.each(chapters, chapter => {
    return updateChapterStats(chapter).catch(err => {
      errors.push(err)
    })
  })

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.error('\n', err))
    throw new Error('Stats computation failed')
  }

  // log final player ratings
  const players = await Player.run()
  players
    .map(player => ({
      id: player.id,
      [ELO]: ((player.stats || {})[ELO] || {}).rating || null
    }))
    .sort((a, b) => a[ELO] - b[ELO])
    .forEach(player => console.log(player.id.slice(0, 8), player[ELO]))
}

async function updateChapterStats(chapter) {
  console.log(LOG_PREFIX, `Updating stats for chapter ${chapter.name} (${chapter.id})`)

  const chapterCycles = await findCyclesForChapter(chapter.id)
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

  const cycleProjects = await Project.filter({chapterId: chapter.id, cycleId: cycle.id})
  return Promise.each(cycleProjects, async project => {
    console.log(LOG_PREFIX, `Updating stats for project ${project.name} (${project.id})`)

    await updatePlayerStatsForProject(project)
    await updateProjectStats(project.id)
  })
}
