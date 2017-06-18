import {Project} from 'src/server/services/dataService'
import {CLOSED} from 'src/common/models/project'

export default async function closeProject(projectOrId) {
  const project = (typeof projectOrId === 'string') ? await Project.get(projectOrId) : projectOrId
  return Project
    .get(project.id)
    .updateWithTimestamp({
      id: project.id,
      state: CLOSED, closedAt: new Date(),
    })
}
