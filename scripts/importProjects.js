/**
 * Update team members for a collection of projects.
 * Accepts project config in JSON format. Can be used
 * to modify an existing project (referenced by name) or
 * to create a new project (by specifying a valid goal number). If
 * a new project is created, all normal project setup actions will be executed
 * as well (creating echo channel, posting welcome message, etc).
 *
 * USAGE
 * =====
 * Create a JSON file containing the project data you want to import. It should
 * contain an srray of objects - one object for each project to be updated. Specify
 * the path to this file in the hardcoded constant below, DATA_FILE_PATH.
 * TODO: accept path as command line parameter.
 *
 * Example - updating an existing project:
 * [{
 *   chapterName: 'Oakland',
 *   cycleNumber: 14,
 *   projectName: 'boiling-pademelon',
 *   playerHandles: ['superawsm', 'malookwhaticando']
 * }]
 *
 * Example - creating a NEW project:
 * [{
 *   chapterName: 'Oakland',
 *   cycleNumber: 14,
 *   goalNumber: 86,
 *   playerHandles: ['superawsm', 'malookwhaticando']
 * }]
 *
 * To execute, run command: npm run import:projects
 */

// FIXME: required by an imported module
global.__SERVER__ = true // eslint-disable import/imports-first

const path = require('path')
const {connect} = require('src/db')
const getUsersByHandles = require('src/server/actions/getUsersByHandles')
const intitiateProjectChannel = require('src/server/actions/intitiateProjectChannel')
const fetchGoalInfo = require('src/server/actions/fetchGoalInfo')
const generateProject = require('src/server/actions/generateProject')
const {insertProjects, getProjectByName} = require('src/server/db/project')
const {updateInTable} = require('src/server/db/util')
const {loadJSON} = require('src/server/util')
const {finish} = require('./util')

const LOG_PREFIX = `${__filename.split('.js')[0]}`
const DATA_FILE_PATH = path.resolve(__dirname, '../tmp/projects.json')

const r = connect()

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []
  const items = await loadJSON(DATA_FILE_PATH, validateProject)

  console.log(LOG_PREFIX, `Importing ${items.length} project team(s)`)

  const imports = items.map(item => {
    return importProjectTeam(item).catch(err => {
      errors.push(err)
    })
  })

  await Promise.all(imports)

  if (errors.length > 0) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.log('\n', err))
    throw new Error('Some imports failed')
  }
}

function validateProject(data) {
  const {
    chapterName,
    cycleNumber,
    playerHandles,
    projectName,
    goalNumber,
  } = data || {}

  if (typeof chapterName !== 'string' || chapterName.length === 0) {
    throw new Error('Must specify a valid chapter name')
  }
  if (isNaN(cycleNumber)) {
    throw new Error('Must specify a valid cycle number')
  }
  if ((typeof projectName !== 'string' || projectName === '') && isNaN(goalNumber)) {
    throw new Error('Must specify a project name or goal number')
  }
  if (!Array.isArray(playerHandles) || playerHandles.length === 0) {
    throw new Error('Must specify at least one valid player handle')
  }

  return data
}

async function importProjectTeam(data) {
  const {
    chapterName,
    cycleNumber,
    playerHandles,
    projectName,
    goalNumber,
  } = data

  const [chapters, players] = await Promise.all([
    r.table('chapters').filter({name: chapterName}),
    getUsersByHandles(playerHandles),
  ])

  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name: ${chapterName}`)
  }

  if (players.length !== playerHandles.length) {
    throw new Error(`Found ${players.length} players but expected ${playerHandles.length}`)
  }

  const cycles = await r.table('cycles').filter({chapterId: chapter.id, cycleNumber})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${cycleNumber} for chapter ${chapterName}`)
  }

  return projectName ?
    updateProjectTeam(chapter, cycle, projectName, players) :
    createProject(chapter, cycle, players, goalNumber)
}

async function updateProjectTeam(chapter, cycle, projectName, players) {
  const projects = await r.table('projects').filter({name: projectName})
  const project = projects[0]
  if (!project) {
    throw new Error(`Invalid project name: ${projectName}`)
  }
  if (project.chapterId !== chapter.id) {
    throw new Error(`Chapter ID ${chapter.id} for ${chapter.name} does not match project chapter ID ${project.chapterId}`)
  }

  const {cycleHistory = []} = project
  const projectCycle = cycleHistory.find(ch => ch.cycleId === cycle.id)
  if (!projectCycle) {
    throw new Error(`Cycle ID ${cycle.id} for number ${cycle.cycleNumber} does not match any cycle for project ${project.id}`)
  }

  // overwrite cycle history player IDs
  projectCycle.playerIds = players.map(p => p.id)

  console.log(LOG_PREFIX, `Updating player IDs for project ${project.id}`)
  return updateInTable({id: project.id, cycleHistory}, r.table('projects'))
}

async function createProject(chapter, cycle, players, goalNumber) {
  // TODO: verify that there isn't already a project in this
  // chapter and cycle for the same team members
  const goal = await fetchGoalInfo(chapter.goalRepositoryURL, goalNumber)
  if (!goal) {
    throw new Error(`Goal info not found for goal number ${goalNumber}`)
  }

  const projectValues = await generateProject({
    chapterId: chapter.id,
    cycleId: cycle.id,
    goal,
    playerIds: players.map(p => p.id),
  })

  await insertProjects([projectValues])

  const project = await getProjectByName(projectValues.name)
  if (!project) {
    throw new Error('Project insert failed')
  }

  console.log(`\nProject created: #${project.name} (${project.id})`)

  return intitiateProjectChannel(project, players)
}
