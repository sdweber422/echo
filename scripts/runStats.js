/* eslint-disable import/imports-first */
const Promise = require('bluebird')

const updateProjectCycleStats = require('src/server/actions/updateProjectStats')
const {findChapters} = require('src/server/db/chapter')
const {getCycleById} = require('src/server/db/cycle')
const {getProjectsForChapter} = require('src/server/db/project')
const {COMPLETE} = require('src/common/models/cycle')
const {finish} = require('./util')

const LOG_PREFIX = '[runStats]'

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []
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

async function updateChapterStats(chapter) {
  console.log(LOG_PREFIX, `Updating stats for chapter ${chapter.id}`)

  const chapterProjects = await getProjectsForChapter(chapter.id)
  return Promise.each(chapterProjects, project => {
    return updateProjectStats(project)
  })
}

function updateProjectStats(project) {
  console.log(LOG_PREFIX, `Updating stats for project ${project.id}`)

  const {cycleHistory} = project
  return Promise.each(cycleHistory, async projectCycle => {
    console.log(LOG_PREFIX, `Updating stats for project ${project.id} cycle ${projectCycle.cycleId}`)

    const cycle = await getCycleById(projectCycle.cycleId)

    if (cycle.state !== COMPLETE) {
      console.log(LOG_PREFIX, `Skipping cycle ${cycle.id} in state ${cycle.state}`)
      return
    }

    return updateProjectCycleStats(project, cycle.id)
  })
}
