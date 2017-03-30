import Promise from 'bluebird'
import {savePools, addPlayerIdsToPool} from 'src/server/db/pool'
import {flatten, range, unique} from 'src/common/util'
import findActiveVotingPlayersInChapter from 'src/server/actions/findActiveVotingPlayersInChapter'

export const MAX_POOL_SIZE = 15
const POOL_NAMES = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Indigo',
  'Violet',
  'Black',
  'White',
  'Silver',
  'Gold',
]

export default async function createPoolsForCycle(cycle) {
  const players = await findActiveVotingPlayersInChapter(cycle.chapterId)
  const sortedPlayers = _sortPlayersByStats(players)
  const poolAssignments = _splitPlayersIntoPools(sortedPlayers)

  await _savePoolAssignments(cycle, poolAssignments)
}

function _sortPlayersByStats(players) {
  return players.sort((a, b) =>
    a.stats.level - b.stats.level ||
    a.stats.elo.rating - b.stats.elo.rating ||
    a.stats.experiencePoints - b.stats.experiencePoints
  )
}

function _splitPlayersIntoPools(playersInChapter) {
  const splitCount = Math.ceil(playersInChapter.length / MAX_POOL_SIZE)
  const playersPerSplit = Math.ceil(playersInChapter.length / splitCount)
  const players = playersInChapter.slice()

  return range(0, splitCount).map(() => {
    const playersForPool = players.splice(0, playersPerSplit)
    const poolLevels = unique(playersForPool.map(p => p.stats.level)).sort()
    return {levels: poolLevels, players: playersForPool}
  })
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const poolInfos = poolAssignments.map(({levels}, poolIdx) => ({
    levels,
    name: POOL_NAMES[poolIdx],
    cycleId: cycle.id,
  }))
  const changes = await savePools(poolInfos, {returnChanges: true})
  const poolIds = flatten(changes.map(_ => _.generated_keys))

  await Promise.map(poolIds, (poolId, i) => {
    const playerIds = poolAssignments[i].players.map(_ => _.id)
    return addPlayerIdsToPool(poolId, playerIds)
  })
}
