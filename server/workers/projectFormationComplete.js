import config from 'src/config'
import {connect} from 'src/db'

const r = connect()

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectFormationComplete', processProjectFormationComplete, /*errorHandler*/)
}

async function processProjectFormationComplete({chapterId, cycleId}) {
  // run report
  // create csv
  // attach to email
  // send email
}
