import {Pool, PlayerPool, Vote, r, getPoolSize} from 'src/server/services/dataService'
import {MAX_POOL_SIZE} from 'src/common/models/pool'

export default async function movePlayerToPoolForLevel(playerId, level, cycleId) {
  const currentPool = await _getPlayerPool(playerId, cycleId)

  if (currentPool.levels.includes(level)) {
    return currentPool
  }

  const targetPool = await _getPoolForLevel(cycleId, level)
  await _changePlayerPool(playerId, currentPool, targetPool)
  return targetPool
}

async function _getPlayerPool(playerId, cycleId) {
  const {pool} = await PlayerPool.filter({playerId})
    .getJoin({pool: true})
    .filter(row => row('pool')('cycleId').eq(cycleId))
    .nth(0)

  return pool
}

function _getPoolForLevel(cycleId, level) {
  return Pool.filter(pool => r.and(
    pool('cycleId').eq(cycleId),
    pool('levels').contains(level),
  ))
  .merge(pool => ({poolSize: getPoolSize(pool('id'))}))
  .orderBy('poolSize')
  .without('poolSize')
  .nth(0)
}

async function _changePlayerPool(playerId, currentPool, targetPool) {
  const targetPoolSize = await getPoolSize(targetPool.id)

  if (targetPoolSize >= MAX_POOL_SIZE - 1) {
    await _splitPool(targetPool, targetPoolSize)
  }

  await PlayerPool
    .filter({playerId, poolId: currentPool.id})
    .updateWithTimestamp({poolId: targetPool.id})

  await Vote
    .filter({playerId, poolId: currentPool.id})
    .updateWithTimestamp({poolId: targetPool.id})
}

async function _splitPool(pool, poolSize) {
  const newPool = await _copyPool(pool)

  const playerPools = await PlayerPool
    .filter({poolId: pool.id})
    .limit(Math.ceil(poolSize / 2))
    .updateWithTimestamp({poolId: newPool.id})

  const movedPlayerIds = playerPools.map(_ => _.playerId)
  await Vote.filter(vote => r.and(
    r.expr(movedPlayerIds).contains(vote('playerId')),
    vote('poolId').eq(pool.id)
  )).updateWithTimestamp({poolId: newPool.id})

  return newPool
}

async function _copyPool(pool) {
  const {cycleId, levels, name} = pool

  const newName = _getNewPoolName(name)

  return await Pool.save({
    cycleId,
    levels,
    name: newName,
  })
}

function _getNewPoolName(oldName) {
  const indexMatch = oldName.match(/(.*) (\d+)$/)
  const oldNameWithoutIndex = indexMatch ? indexMatch[1] : oldName
  const previousIndex = parseInt(indexMatch ? indexMatch[2] : '1', 10)
  return `${oldNameWithoutIndex} ${previousIndex + 1}`
}
