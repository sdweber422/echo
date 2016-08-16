import {findProjects} from 'src/server/db/project'
import randomMemorableName from 'src/server/util/randomMemorableName'

export default function generateProjectName() {
  const projectName = randomMemorableName()

  return findProjects({name: projectName}).run().then(existingProjectsWithName => {
    return existingProjectsWithName.length ? generateProjectName() : projectName
  })
}
