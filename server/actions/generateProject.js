/* eslint-disable prefer-arrow-callback */
import generateProjectName from 'src/server/actions/generateProjectName'

export default function generateProject({chapterId, cycleId, goal, playerIds, name}) {
  const buildProject = theName => ({
    chapterId,
    name: theName,
    goal,
    cycleHistory: [{
      cycleId,
      playerIds,
    }],
  })

  return name ?
    Promise.resolve(buildProject(name)) :
    generateProjectName().then(buildProject)
}
