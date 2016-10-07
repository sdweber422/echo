/* eslint-disable import/imports-first */

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const path = require('path')
const r = require('src/db/connect')
const getUsersByHandles = require('src/server/actions/getUsersByHandles')
const {updateInTable} = require('src/server/db/util')
const {loadJSON} = require('src/server/util')
const {finish} = require('./util')

const LOG_PREFIX = `${__filename.split('.js')[0]}`
const DATA_FILE_PATH = path.resolve(__dirname, '../tmp/project-teams.json')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []
  const items = await loadJSON(DATA_FILE_PATH, validateProject)

  console.log(LOG_PREFIX, `Importing ${items.length} project teams`)

  const imports = items.map(item => {
    return importProjectTeam(item).catch(err => {
      errors.push(err)
    })
  })

  await Promise.all(imports)

  if (errors.length) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.log('\n', err))
    throw new Error('Some imports failed')
  }
}

function validateProject(data) {
  const {chapterName, cycleNumber, projectName, playerHandles} = data || {}

  if (typeof chapterName !== 'string' || !chapterName.length) {
    throw new Error('Must specify a valid chapter name')
  }
  if (isNaN(cycleNumber)) {
    throw new Error('Must specify a valid cycle number')
  }
  if (typeof projectName !== 'string' || !projectName.length) {
    throw new Error('Must specify a valid project name')
  }
  if (!Array.isArray(playerHandles) || !playerHandles.length) {
    throw new Error('Must specify at least one valid player handle')
  }

  return data
}

async function importProjectTeam(data) {
  const {
    chapterName,
    cycleNumber,
    projectName,
    playerHandles,
  } = data

  const [chapters, projects, players] = await Promise.all([
    r.table('chapters').filter({name: chapterName}),
    r.table('projects').filter({name: projectName}),
    getUsersByHandles(playerHandles),
  ])

  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name: ${chapterName}`)
  }
  const project = projects[0]
  if (!project) {
    throw new Error(`Invalid project name: ${projectName}`)
  }
  if (project.chapterId !== chapter.id) {
    throw new Error(`Chapter ID ${chapter.id} does not match project chapter ID ${project.chapterId}`)
  }
  if (players.length !== playerHandles.length) {
    throw new Error(`Found ${players.length} players but expected ${playerHandles.length}`)
  }

  const cycles = await r.table('cycles').filter({chapterId: chapter.id, cycleNumber})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${cycleNumber} for chapter ${chapterName}`)
  }

  const {cycleHistory = []} = project
  const projectCycle = cycleHistory.find(ch => ch.cycleId === cycle.id)
  if (!projectCycle) {
    throw new Error(`Invalid cycle number ${cycleNumber} for project ${project.id}`)
  }

  // overwrite cycle history player IDs
  projectCycle.playerIds = players.map(p => p.id)

  console.log(LOG_PREFIX, `Updating player IDs for project ${project.id}`)

  const result = await updateInTable({id: project.id, cycleHistory}, r.table('projects'))
  console.log('result:', result)
}
