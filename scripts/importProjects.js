/* eslint-disable import/imports-first */
/**
 * Update team members for a collection of projects.
 * Accepts project config in JSON format. Can be used
 * to modify an existing project (referenced by name) or
 * to create a new project (by specifying a valid goal number). If
 * a new project is created, all normal project setup actions will be
 * attempted as well (creating echo channel, posting welcome message, etc).
 */

// FIXME: required by an imported module
global.__SERVER__ = true // eslint-disable import/imports-first

const parseArgs = require('minimist')

const {connect} = require('src/db')
const getUsersByHandles = require('src/server/actions/getUsersByHandles')
const initializeProjectChannel = require('src/server/actions/initializeProjectChannel')
const fetchGoalInfo = require('src/server/actions/fetchGoalInfo')
const generateProject = require('src/server/actions/generateProject')
const {insertProjects, getProjectByName} = require('src/server/db/project')
const {updateInTable} = require('src/server/db/util')
const {loadJSON} = require('src/server/util')
const {finish} = require('./util')

const LOG_PREFIX = `${__filename.split('.js')[0]}`

const r = connect()

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {
    INPUT_FILE,
    SKIP_CHANNEL_CREATION,
  } = _parseCLIArgs(process.argv.slice(2))

  const errors = []
  const items = await loadJSON(INPUT_FILE, validateProject)

  console.log(LOG_PREFIX, `Importing ${items.length} project team(s)`)

  const imports = items.map(item => {
    return importProject(item, SKIP_CHANNEL_CREATION).catch(err => {
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

async function importProject(data) {
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

  let goal
  if (goalNumber) {
    goal = await fetchGoalInfo(chapter.goalRepositoryURL, goalNumber)
    if (!goal) {
      throw new Error(`Goal info not found for goal number ${goalNumber}`)
    }
  }

  let project
  if (projectName) {
    project = await getProjectByName(projectName)
    if (!project) {
      throw new Error(`Invalid project name: ${projectName}`)
    }
    if (project.chapterId !== chapter.id) {
      throw new Error(`Chapter ID ${chapter.id} for ${chapter.name} does not match project chapter ID ${project.chapterId}`)
    }
    if (project.cycleId !== cycle.id) {
      throw new Error(`Cycle ID ${cycle.id} does not match project cycle ID ${project.cycleId}`)
    }
  }

  return project ?
    updateProjectTeam({project, players, goal}) :
    createProject({chapter, cycle, players, goal, projectName})
}

function updateProjectTeam({project, players, goal}) {
  console.log(LOG_PREFIX, `Updating project ${project.id}`)
  const values = {
    id: project.id,
    playerIds: players.map(p => p.id)
  }
  if (goal) {
    values.goal = goal
  }
  return updateInTable(values, r.table('projects'))
}

async function createProject({chapter, cycle, players, goal, projectName}) {
  // TODO: verify that there isn't already a project in this
  // chapter and cycle for the same team members
  const values = await generateProject({
    goal,
    chapterId: chapter.id,
    cycleId: cycle.id,
    name: projectName,
    playerIds: players.map(p => p.id),
  })

  await insertProjects([values])

  const project = await getProjectByName(values.name)
  if (!project) {
    throw new Error('Project insert failed')
  }

  console.log(`\nProject created: #${project.name} (${project.id})`)

  return initializeProjectChannel(project, players)
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [INPUT_FILE] = args._
  if (!INPUT_FILE) {
    console.warn('Usage:')
    console.warn('  npm run import:projects -- INPUT_FILE')
    throw new Error('Invalid Arguments')
  }
  return {INPUT_FILE}
}
