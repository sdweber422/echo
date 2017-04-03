import Promise from 'bluebird'
import {savePools, addPlayerIdsToPool} from 'src/server/db/pool'
import {computePlayerLevel, getPlayerStat} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {flatten, range, unique} from 'src/common/util'
import findActiveVotingPlayersInChapter from 'src/server/actions/findActiveVotingPlayersInChapter'

const {
  ELO,
  EXPERIENCE_POINTS,
  LEVEL,
} = STAT_DESCRIPTORS

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

const _elo = p => getPlayerStat(p, `${ELO}.rating`)
const _level = p => getPlayerStat(p, LEVEL) || computePlayerLevel(p)
const _xp = p => getPlayerStat(p, EXPERIENCE_POINTS)

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
