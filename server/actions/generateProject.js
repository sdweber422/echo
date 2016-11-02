/* eslint-disable prefer-arrow-callback */
import generateProjectName from 'src/server/actions/generateProjectName'

export default async function generateProject({chapterId, cycleId, goal, playerIds, name}) {
  return {
    chapterId,
    name: name || await generateProjectName(),
    goal,
    cycleId,
    playerIds,
  }
}
