/* eslint-disable prefer-arrow-callback */
import generateProjectName from 'src/server/actions/generateProjectName'

export default function generateProject({chapterId, cycleId, goal, playerIds}) {
  return generateProjectName().then(name => {
    return {
      chapterId,
      name,
      goal,
      cycleHistory: [{
        cycleId,
        playerIds,
      }],
    }
  })
}
