import Promise from 'bluebird'

import r from '../../r'
import {
  insertIntoTable,
  insertAllIntoTable,
  replaceInTable,
  checkForWriteErrors,
} from '../../util'

const poolsTable = r.table('pools')
const cyclesTable = r.table('cycles')
const votesTable = r.table('votes')
const playersPoolsTable = r.table('playersPools')

export async function migrateVotesToPoolsUp() {
  const cycles = await cyclesTable
  await Promise.map(cycles, _migrateCycleVotesToPoolUp)
}

async function _migrateCycleVotesToPoolUp(cycle) {
  const pool = await _ensurePoolForCycle(cycle)
  await _updateCycleVotesWithPoolId(cycle, pool)
  await _assignPlayersToPool(cycle, pool)
  await _removeCycleIdFromVotes(cycle)
}

function _updateCycleVotesWithPoolId(cycle, pool) {
  return votesTable
    .filter({cycleId: cycle.id})
    .update({poolId: pool.id, updatedAt: r.now()})
    .then(checkForWriteErrors)
}

async function _assignPlayersToPool(cycle, pool) {
  const playerIds = await votesTable
    .filter({cycleId: cycle.id})('playerId')
    .distinct()
  const playerPools = playerIds.map(playerId => ({playerId, poolId: pool.id}))
  await insertAllIntoTable(playerPools, playersPoolsTable)
}

function _removeCycleIdFromVotes(cycle) {
  return _removeAttrFromVotes(cycle, 'cycleId')
}

function _removeAttrFromVotes(cycle, attr) {
  return votesTable
    .filter({cycleId: cycle.id})
    .replace(v => v.without(attr))
    .then(checkForWriteErrors)
}

async function _ensurePoolForCycle(cycle) {
  const [exisitngPool] = await poolsTable.filter({cycleId: cycle.id})
  if (exisitngPool) {
    return exisitngPool
  }

  const result = await _savePool({
    name: 'default',
    cycleId: cycle.id,
  }, {returnChanges: true})
  const pool = result.changes[0].new_val

  return pool
}

export async function migrateVotesToPoolsDown() {
  const cycles = await cyclesTable
  await Promise.map(cycles, _migrateCycleVotesToPoolDown)
}

export async function _migrateCycleVotesToPoolDown(cycle) {
  await _updateCycleVotesWithCycleId(cycle)
  await _removePoolIdFromVotes(cycle)
}

async function _updateCycleVotesWithCycleId(cycle) {
  const poolsIdsExpr = poolsTable.filter({cycleId: cycle.id})('id').coerceTo('array')
  const votesExpr = votesTable.getAll(r.args(poolsIdsExpr), {index: 'poolId'})
  await votesExpr.update({cycleId: cycle.id})
}

function _removePoolIdFromVotes(cycle) {
  return _removeAttrFromVotes(cycle, 'poolId')
}

function _savePool(pool, options) {
  if (pool.id) {
    return replaceInTable(pool, poolsTable, options)
  }
  return insertIntoTable(pool, poolsTable, options)
}
