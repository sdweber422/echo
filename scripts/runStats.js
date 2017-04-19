/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const updatePlayerStatsForProject = require('src/server/actions/updatePlayerStatsForProject')
const updateProjectStats = require('src/server/actions/updateProjectStats')
const {COMPLETE} = require('src/common/models/cycle')
const {
  Chapter,
  Player,
  Project,
  findCyclesForChapter,
} = require('src/server/services/dataService')
const {finish} = require('./util')

const LOG_PREFIX = '[runStats]'

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []

  // reset project & player stats
  await Project.replace(row => row.without('stats'))
  await Player.replace(row => row.without('stats'))
  await Player.update(row => ({
    stats: row('statsBaseline').default({}),
  }))

  // calculate stats for each player in each project in each cycle in each chapter
  const chapters = await Chapter.run()
  await Promise.each(chapters, chapter => {
    return _updateChapterStats(chapter).catch(err => {
      errors.push(err)
    })
  })

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.error('\n', err))
    throw new Error('Stats computation failed')
  }
}

async function _updateChapterStats(chapter) {
  console.log(LOG_PREFIX, `Updating stats for chapter ${chapter.name}`)

  const chapterCycles = await findCyclesForChapter(chapter.id)
  const chapterCyclesSorted = chapterCycles.sort((a, b) => a.cycleNumber - b.cycleNumber)
  await Promise.each(chapterCyclesSorted, cycle => {
    if (cycle.state !== COMPLETE) {
      console.log(LOG_PREFIX, `Skipping cycle ${cycle.cycleNumber} in state ${cycle.state}`)
      return
    }
    return _updateChapterCycleStats(chapter, cycle)
  })
}

async function _updateChapterCycleStats(chapter, cycle) {
  const cycleProjects = await Project.filter({chapterId: chapter.id, cycleId: cycle.id})
  console.log(LOG_PREFIX, `Updating stats for ${cycleProjects.length} projects in cycle ${cycle.cycleNumber}`)
  await Promise.each(cycleProjects, async project => {
    await updatePlayerStatsForProject(project)
    await updateProjectStats(project.id)
  })
}
