import parseArgs from 'minimist'
import closeProject from 'src/server/actions/closeProject'
import {finish} from './util'

run()
  .then(() => finish())
  .catch(finish)

async function run() {
  const {id} = parseArgs(process.argv.slice(2))
  console.log(`Closing project ${id}`)
  await closeProject(id)
}
