import Promise from 'bluebird'

import {range, unique, groupById, shuffle} from 'src/common/util'
import {Pool, PlayerPool} from 'src/server/services/dataService'
import findActiveVotingPlayersInChapter from 'src/server/actions/findActiveVotingPlayersInChapter'
import {MAX_POOL_SIZE} from 'src/common/models/pool'

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
  const playersByPhaseId = groupById(players, 'phaseId')

  const poolAssignments = []
  playersByPhaseId.forEach(phasePlayers => {
    poolAssignments.push(..._splitPlayersIntoPools(phasePlayers))
  })

  await _savePoolAssignments(cycle, poolAssignments)
}

function _splitPlayersIntoPools(players) {
  const splitCount = Math.ceil(players.length / MAX_POOL_SIZE)
  const playersPerSplit = Math.ceil(players.length / splitCount)
  const shuffledPlayers = shuffle(players.slice())

  return range(0, splitCount).map(() => {
    const playersForPool = shuffledPlayers.splice(0, playersPerSplit)
    const phaseIds = unique(playersForPool.map(_ => _.phaseId))
    if (phaseIds.length !== 1) {
      throw new Error(`Invalid attempt to create a pool with players from multiple phases: [${phaseIds.join(',')}]`)
    }
    return {phaseId: phaseIds[0], players: playersForPool}
  })
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const pools = poolAssignments.map(({phaseId}, i) => ({
    phaseId,
    name: POOL_NAMES[i],
    cycleId: cycle.id,
  }))

  const newPools = Pool.save(pools)

  await Promise.map(newPools, (pool, i) => {
    const playerIds = poolAssignments[i].players.map(_ => _.id)
    const playerPools = playerIds.map(playerId => ({playerId, poolId: pool.id}))
    return PlayerPool.save(playerPools)
  })
}
