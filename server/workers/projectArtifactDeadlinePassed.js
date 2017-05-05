import {Project} from 'src/server/services/dataService'
import ensureProjectArtifactIsSet from 'src/server/actions/ensureProjectArtifactIsSet'

const TWENTY_FOUR_HOURS_IN_MS = 1000 * 60 * 60 * 24

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectArtifactDeadlinePassed', processProjectArtifactDeadlinePassed)
}

export async function processProjectArtifactDeadlinePassed(projectId) {
  const project = await Project.get(projectId)
  const artifactIsSet = await ensureProjectArtifactIsSet(project)

  if (!artifactIsSet) {
    const jobService = require('src/server/services/jobService')
    jobService.createJob('projectArtifactDeadlinePassed', projectId, {delay: TWENTY_FOUR_HOURS_IN_MS})
  }
}
