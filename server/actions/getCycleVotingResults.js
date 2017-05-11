import {
  Cycle,
  getLatestCycleForChapter,
  findPoolsForCycle,
} from 'src/server/services/dataService'

export default async function getCycleVotingResults(chapterId, cycleId) {
  const cycle = cycleId ?
    await Cycle.get(cycleId).getJoin({chapter: true}) :
    await getLatestCycleForChapter(chapterId, {mergeChapter: true})

  const pools = await findPoolsForCycle(cycle)

  return {
    id: 'CURRENT', // TODO: make this the cycleId? Need an id for normalizr on the client-side
    cycle,
    pools,
  }
}
