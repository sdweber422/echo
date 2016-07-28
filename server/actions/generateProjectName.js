import {findProjects} from '../db/project'
import randomMemorableName from '../util/randomMemorableName'

export default function generateProjectName() {
  const projectName = randomMemorableName()

  return findProjects({name: projectName}).run().then(existingProjectsWithName => {
    return existingProjectsWithName.length ? generateProjectName() : projectName
  })
}
