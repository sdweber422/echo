import {COMPLETE} from 'src/common/models/cycle'
import {r, Player, Project, getLatestCycleForChapter} from 'src/server/services/dataService'

export default async function findActiveProjectsForPlayer(playerId) {
  const player = await Player.get(playerId)
  const latestCycle = await getLatestCycleForChapter(player.chapterId, {default: null})
  if (!latestCycle || latestCycle.state === COMPLETE) {
    return []
  }
  return Project.filter(project => r.and(
    project('cycleId').eq(latestCycle.id),
    project('playerIds').contains(player.id)
  ))
}
