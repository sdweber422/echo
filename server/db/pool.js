import {connect} from 'src/db'
import {insertIntoTable, replaceInTable} from 'src/server/db/util'
import {playersTable} from 'src/server/db/player'

const r = connect()
export const poolsTable = r.table('pools')

export function savePool(pool, opts) {
  if (pool.id) {
    return replace(pool, opts)
  }
  return insert(pool, opts)
}

export function savePools(pools, opts) {
  return Promise.all(pools.map(
    pool => savePool(pool, opts)
  ))
}

export function getPoolById(id) {
  return poolsTable.get(id)
}

export function findPools(filter) {
  if (filter) {
    return poolsTable.filter(filter)
  }
  return poolsTable
}

export function getPlayersInPool(poolId) {
  return r.table('players_pools').filter({poolId})
    .eqJoin('playerId', playersTable)
    .map(join => join('right'))
}

export function addPlayerIdsToPool(poolId, playerIds) {
  return r.table('players_pools').insert(
    playerIds.map(playerId => ({playerId, poolId}))
  )
}

function replace(pool, options) {
  return replaceInTable(pool, poolsTable, options)
}

function insert(pool, options) {
  return insertIntoTable(pool, poolsTable, options)
}
