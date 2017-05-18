import Promise from 'bluebird'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {range, unique} from 'src/common/util'
import {Pool, PlayerPool} from 'src/server/services/dataService'
import {computePlayerLevel, extractStat} from 'src/server/util/stats'
import findActiveVotingPlayersInChapter from 'src/server/actions/findActiveVotingPlayersInChapter'
import {MAX_POOL_SIZE} from 'src/common/models/pool'

const {
  ELO,
  EXPERIENCE_POINTS,
  LEVEL,
} = STAT_DESCRIPTORS

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

const _elo = p => extractStat(p.stats, `${ELO}.rating`)
const _level = p => extractStat(p.stats, LEVEL) || computePlayerLevel(p.stats)
const _xp = p => extractStat(p.stats, EXPERIENCE_POINTS)

function _sortPlayersByStats(players) {
  return players.sort((a, b) =>
    _level(a) - _level(b) ||
    _elo(a) - _elo(b) ||
    _xp(a) - _xp(b)
  )
}

function _splitPlayersIntoPools(playersInChapter) {
  const splitCount = Math.ceil(playersInChapter.length / MAX_POOL_SIZE)
  const playersPerSplit = Math.ceil(playersInChapter.length / splitCount)
  const players = playersInChapter.slice()

  return range(0, splitCount).map(() => {
    const playersForPool = players.splice(0, playersPerSplit)
    const poolLevels = unique(playersForPool.map(_level)).sort()
    return {levels: poolLevels, players: playersForPool}
  })
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const pools = poolAssignments.map(({levels}, i) => ({
    levels,
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
