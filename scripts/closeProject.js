import parseArgs from 'minimist'
import closeProject from 'src/server/actions/closeProject'
import {Project} from 'src/server/services/dataService'
import {finish} from './util'

if (!module.parent) {
  run()
    .then(() => finish())
    .catch(finish)
}

async function run() {
  const {_: [projectName]} = parseArgs(process.argv.slice(2))

  if (!projectName) {
    console.warn('USAGE: npm run closeProject <projectName>')
    return
  }

  const project = await Project.filter({name: projectName}).nth(0)
  if (!project) {
    console.warn(`WARNING: No project found with name ${projectName}`)
    return
  }

  console.info(`Closing project ${project.name} (${project.id})`)

  await closeProject(project.id)
}
