import Promise from 'bluebird'
import {savePools, addPlayerIdsToPool} from 'src/server/db/pool'
import {flatten} from 'src/common/util'
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
  return players.sort((a, b) => _sortByLevel(a, b))
}

function _sortByLevel(a, b) {
  if (a.stats.level < b.stats.level) {
    return -1
  } else if (a.stats.level > b.stats.level) {
    return 1
  }
  return _sortByElo(a, b)
}

function _sortByElo(a, b) {
  if (a.stats.elo.rating < b.stats.elo.rating) {
    return -1
  } else if (a.stats.elo.rating > b.stats.elo.rating) {
    return 1
  }
  return _sortByXP(a, b)
}

function _sortByXP(a, b) {
  if (a.stats.experiencePoints < b.stats.experiencePoints) {
    return -1
  } else if (a.stats.experiencePoints > b.stats.experiencePoints) {
    return 1
  }
  return 0
}

function _splitPlayersIntoPools(players) {
  const poolSize = _findMostEvenPoolDistribution(players, MAX_POOL_SIZE)
  const pools = []
  let count = 1
  let currentPool = []

  while (count <= players.length) {
    currentPool.push(players[count - 1])
    if ((count % poolSize === 0) || (count === players.length)) {
      pools.push(currentPool)
      currentPool = []
    }
    count++
  }
  return pools
}

function _findMostEvenPoolDistribution(players) {
  let bestFitPoolSize = 6
  let poolSize = 6
  let remainder

  while (poolSize <= MAX_POOL_SIZE) {
    if (remainder === undefined ||
      ((players.length % poolSize > remainder) && (remainder !== 0)) ||
      (players.length % poolSize === 0)) {
      remainder = players.length % poolSize
      bestFitPoolSize = poolSize
    }
    poolSize++
  }
  return bestFitPoolSize
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const poolInfos = poolAssignments.map((pool, poolIdx) => ({
    name: POOL_NAMES[poolIdx],
    cycleId: cycle.id,
  }))
  const changes = await savePools(poolInfos, {returnChanges: true})
  const poolIds = flatten(changes.map(_ => _.generated_keys))

  await Promise.map(poolIds, (poolId, i) => {
    const playerIds = poolAssignments[i].map(_ => _.id)
    return addPlayerIdsToPool(poolId, playerIds)
  })
}
