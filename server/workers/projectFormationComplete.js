import {runReport} from 'src/server/reports/projectTeams'
import {sendCycleFormationReport} from 'src/server/mailer'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectFormationComplete', processProjectFormationComplete)
}

async function processProjectFormationComplete(cycle) {
  const {cycleNumber, chapterId} = cycle
  return runReport({cycleNumber, chapterId}).then(report =>
    sendCycleFormationReport(report, cycleNumber)
  )
}
