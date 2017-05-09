/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const Promise = require('bluebird')

const updatePlayerStatsForProject = require('src/server/actions/updatePlayerStatsForProject')
const updateProjectStats = require('src/server/actions/updateProjectStats')
const closeProject = require('src/server/actions/closeProject')
const {CLOSED, TRUSTED_PROJECT_REVIEW_START_DATE} = require('src/common/models/project')
const {COMPLETE} = require('src/common/models/cycle')
const {
  Chapter,
  Player,
  Project,
  findCyclesForChapter,
  r,
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
      console.log(LOG_PREFIX, `Encountered an error in chapter ${chapter.name}`)
      errors.push(err)
    })
  })

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.error('\n', err.stack || err))
    throw new Error('Stats computation failed')
  }
}

async function _updateChapterStats(chapter) {
  console.log(LOG_PREFIX, `Updating stats for chapter ${chapter.name}`)

  const chapterCycles = await findCyclesForChapter(chapter.id)
  const chapterCyclesSorted = chapterCycles.sort((a, b) => a.cycleNumber - b.cycleNumber)

  console.log(LOG_PREFIX, `Found ${chapterCycles.length} cycles`)

  await Promise.each(chapterCyclesSorted, cycle => {
    if (cycle.state !== COMPLETE) {
      console.log(LOG_PREFIX, `Skipping cycle ${cycle.cycleNumber} in state ${cycle.state}`)
      return
    }
    return _updateChapterCycleStats(chapter, cycle)
  })

  await reRunChapterProjectClosings(chapter)
}

async function _updateChapterCycleStats(chapter, cycle) {
  const cycleProjects = await Project.filter({chapterId: chapter.id, cycleId: cycle.id})
  console.log(LOG_PREFIX, `Updating stats for ${cycleProjects.length} projects in cycle ${cycle.cycleNumber}`)
  await Promise.each(cycleProjects, async project => {
    console.log(LOG_PREFIX, ' - ', project.name)
    await updatePlayerStatsForProject(project)
    await updateProjectStats(project.id)
  })
}

async function reRunChapterProjectClosings(chapter) {
  const projects = await Project
    .between(TRUSTED_PROJECT_REVIEW_START_DATE, r.maxval, {index: 'closedAt'})
    .filter({state: CLOSED, chapterId: chapter.id})
    .orderBy('closedAt')

  console.info(`Re-closing ${projects.length} projects`)

  await Promise.each(projects, (project, i, total) => {
    console.log(
      `[${i + 1}/${total}]`,
      `Closing project ${project.name} (${project.id})`,
      `originally closed on ${project.closedAt.toDateString()}`,
    )
    return closeProject(project.id, {updateClosedAt: false})
  })
}

