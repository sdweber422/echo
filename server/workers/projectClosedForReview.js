import closeProject from 'src/server/actions/closeProject'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectClosedForReview', processProjectClosedForReview)
}

export async function processProjectClosedForReview(project) {
  await closeProject(project.id)
}
