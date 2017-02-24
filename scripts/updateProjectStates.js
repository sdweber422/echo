import updateProjectStates from 'src/server/actions/updateProjectStates'
import {finish} from './util'

run()
  .then(() => finish())
  .catch(finish)

async function run() {
  console.log('Updating project states for projects in REVIEW')
  await updateProjectStates()
  console.log('Done')
}
