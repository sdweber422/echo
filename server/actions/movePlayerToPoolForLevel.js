import {Pool, PlayerPool, Vote, r, getPoolSize} from 'src/server/services/dataService'
import {MAX_POOL_SIZE} from 'src/common/models/pool'

export default async function movePlayerToPoolForLevel(playerId, level, cycleId) {
  const currentPool = await _getPlayerPool(playerId, cycleId)

  if (currentPool.levels.includes(level)) {
    return currentPool
  }

  const targetPool = await _getPoolForLevel(cycleId, level)
  await _changePlayerPool(playerId, currentPool, targetPool)
  await _combinePoolWithAdjacentIfPossible(currentPool)
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

  if (targetPoolSize >= MAX_POOL_SIZE) {
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

  await _movePlayersBetweenPools({
    from: pool,
    to: newPool,
    limit: Math.ceil(poolSize / 2),
  })

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

async function _movePlayersBetweenPools({from, to, limit}) {
  let playerPoolsQuery = PlayerPool.filter({poolId: from.id})

  if (limit) {
    playerPoolsQuery = playerPoolsQuery.limit(limit)
  }

  const playerPools = await playerPoolsQuery
    .updateWithTimestamp({poolId: to.id})

  const movedPlayerIds = playerPools.map(_ => _.playerId)
  await Vote.filter(vote => r.and(
    r.expr(movedPlayerIds).contains(vote('playerId')),
    vote('poolId').eq(from.id)
  )).updateWithTimestamp({poolId: to.id})
}

async function _combinePoolWithAdjacentIfPossible(pool) {
  const adjacentPool = await _getSmallAdjacentPool(pool)

  if (!adjacentPool) {
    return
  }

  await _movePlayersBetweenPools({
    from: adjacentPool,
    to: pool,
  })

  await Pool.get(pool.id).updateWithTimestamp(_ => ({
    levels: _('levels').setUnion(adjacentPool.levels)
  }))
  await Pool.get(adjacentPool.id).delete()
}

async function _getSmallAdjacentPool(pool) {
  const poolSize = await getPoolSize(pool.id)

  const levelsInCommon =
    row => row('levels').setIntersection(pool.levels).count()
  const isSmallEnoughToCombine =
    row => getPoolSize(row('id')).le(MAX_POOL_SIZE - poolSize)

  const adjacentPools = await Pool
    .merge(row => ({
      levelsInCommon: levelsInCommon(row)
    }))
    .filter(row => r.and(
      row('id').ne(pool.id),
      row('levelsInCommon').gt(0),
      isSmallEnoughToCombine(row)
    ))
    .orderBy(r.desc('levelsInCommon'))
    .without('levelsInCommon')

  return adjacentPools[0]
}
