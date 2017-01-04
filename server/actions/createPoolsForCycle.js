import Promise from 'bluebird'
import {savePools, addPlayerIdsToPool} from 'src/server/db/pool'
import {flatten} from 'src/common/util'
import {shuffle, range} from 'src/server/util'
import getActivePlayersInChapter from 'src/server/actions/getActivePlayersInChapter'

const MAX_POOL_SIZE = 15
/* eslint-disable key-spacing */
const LEVELS = [
  {level: 0, xp:    0, elo:    0},
  {level: 1, xp:    0, elo:  850},
  {level: 2, xp:  150, elo: 1000},
  {level: 3, xp:  500, elo: 1050},
  {level: 4, xp:  750, elo: 1100},
  {level: 5, xp: 1000, elo: 1150},
]
/* eslint-enable key-spacing */
const LEVELS_DESC = LEVELS.slice().reverse()

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
  const players = await getActivePlayersInChapter(cycle.chapterId)
  const poolAssignments = _splitPlayersIntoPools(players)
  await _savePoolAssignments(cycle, poolAssignments)
}

function _splitPlayersIntoPools(players) {
  const playerLevelById = players.reduce((result, player) => {
    result.set(player.id, _getLevel(player))
    return result
  }, new Map())

  const playersPerLevel = LEVELS.map(() => [])

  players.forEach(player => {
    const level = playerLevelById.get(player.id)
    playersPerLevel[level].push(player)
  })

  return playersPerLevel.reduce(_poolsForLevels, [])
}

function _poolsForLevels(result, playersForLevel, level) {
  const levelSize = playersForLevel.length

  if (levelSize === 0) {
    return result
  }

  if (levelSize <= MAX_POOL_SIZE) {
    result.push({level, players: playersForLevel})
    return result
  }

  // ensure no more than MAX_POOL_SIZE in any given pool
  const splitCount = Math.ceil(levelSize / MAX_POOL_SIZE)
  const playersPerSplit = Math.ceil(levelSize / splitCount)
  const players = shuffle(playersForLevel.slice())
  range(0, splitCount).forEach(() => {
    result.push({level, players: players.splice(0, playersPerSplit)})
  })

  return result
}

function _getLevel(player) {
  const elo = _playerElo(player)
  const xp = _playerXp(player)

  for (const {level, xp: lvlXp, elo: lvlElo} of LEVELS_DESC) {
    if (xp >= lvlXp && elo >= lvlElo) {
      return level
    }
  }

  throw new Error(`Could not place this player in ANY level! ${player.id}`)
}

function _playerElo(player) {
  return parseInt(((player.stats || {}).elo || {}).rating, 10) || 0
}

function _playerXp(player) {
  return parseInt((player.stats || {}).xp, 10) || 0
}

async function _savePoolAssignments(cycle, poolAssignments) {
  const poolInfos = poolAssignments.map(({level}, poolIdx) => ({
    level,
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
