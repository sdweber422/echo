import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export async function up(r, conn) {
  await addPoolTables(r, conn)
  await migrateVotesTableUp(r, conn)
}

export async function down(r, conn) {
  await dropPoolTables(r, conn)
  await migrateVotesTableDown(r, conn)
}

async function addPoolTables(r, conn) {
  await r.tableCreate('pools', createOptions).run(conn)
  await r.tableCreate('players_pools', createOptions).run(conn)
  await r.table('players_pools').indexCreate('poolId').run(conn)
  await r.table('players_pools').indexCreate('playerId').run(conn)
}

async function dropPoolTables(r, conn) {
  await Promise.all([
    dropIfPresent('pools', r, conn),
    dropIfPresent('players_pools', r, conn)
  ])
}

function dropIfPresent(tableName, r, conn) {
  return r.and(
    r.tableList().contains(tableName),
    r.tableDrop(tableName)
  ).run(conn)
}

async function migrateVotesTableUp(r, conn) {
  await r.table('votes').indexCreate('playerIdAndPoolId', [r.row('playerId'), r.row('poolId')]).run(conn)
  await r.table('votes').indexDrop('playerIdAndCycleId').run(conn)

  await r.table('votes').indexCreate('poolId').run(conn)
}

async function migrateVotesTableDown(r, conn) {
  await r.table('votes').indexCreate('playerIdAndCycleId', [r.row('playerId'), r.row('cycleId')]).run(conn)
  await r.table('votes').indexDrop('playerIdAndPoolId').run(conn)

  await r.table('votes').indexDrop('poolId').run(conn)
}
