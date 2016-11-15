import Promise from 'bluebird'
import {cyclesTable} from 'src/server/db/cycle'
import {
  savePool,
  addPlayerIdsToPool,
  findPoolsByCycleId,
} from 'src/server/db/pool'
import {checkForWriteErrors} from 'src/server/db/util'
import {votesTable} from 'src/server/db/vote'
import {connect} from 'src/db'
import {finish} from 'src/scripts/util'

const r = connect()

export async function migrateVotesToPools() {
  const cycles = await _cycles()
  await Promise.map(cycles, _migrateCycleVotesToPool)
}

async function _migrateCycleVotesToPool(cycle) {
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

  await addPlayerIdsToPool(pool.id, playerIds)
}

function _removeCycleIdFromVotes(cycle) {
  return votesTable
    .filter({cycleId: cycle.id})
    .replace(v => v.without('cycleId'))
    .then(checkForWriteErrors)
}

function _cycles() {
  return cyclesTable
}

async function _ensurePoolForCycle(cycle) {
  const [exisitngPool] = await findPoolsByCycleId(cycle.id)
  if (exisitngPool) {
    return exisitngPool
  }

  const result = await savePool({
    name: 'default',
    cycleId: cycle.id,
  }, {returnChanges: true})
  const pool = result.changes[0].new_val

  return pool
}

if (!module.parent) {
  console.log('Migrating Cycle Votes To Pools')
  migrateVotesToPools()
    .then(() => finish())
    .catch(finish)
}
