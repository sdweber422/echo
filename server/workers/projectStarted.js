const TWENTY_FOUR_HOURS_IN_MS = 1000 * 60 * 60 * 24

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectStarted', processProjectStarted)
}

export function processProjectStarted(project) {
  const jobService = require('src/server/services/jobService')
  jobService.createJob('projectArtifactDeadlinePassed', project.id, {delay: TWENTY_FOUR_HOURS_IN_MS})
}
