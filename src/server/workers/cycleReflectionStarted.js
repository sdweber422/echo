import ensureCycleReflectionSurveysExist from 'src/server/actions/ensureCycleReflectionSurveysExist'
import sendCycleReflectionAnnouncements from 'src/server/actions/sendCycleReflectionAnnouncements'
import reloadDefaultModelData from 'src/server/actions/reloadDefaultModelData'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('cycleReflectionStarted', processCycleReflectionStarted)
}

export async function processCycleReflectionStarted(cycle) {
  console.log(`Starting reflection for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  await reloadDefaultModelData()
  await ensureCycleReflectionSurveysExist(cycle)
  await sendCycleReflectionAnnouncements(cycle.id)

  console.log(`Cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId} reflection successfully started`)
}
