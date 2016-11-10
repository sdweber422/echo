import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export async function up(r, conn) {
  await r.tableCreate('pools', createOptions).run(conn)
  await r.tableCreate('players_pools', {...createOptions, primaryKey: 'playerId'}).run(conn)
  await r.table('players_pools').indexCreate('poolId').run(conn)
}

export function down(r, conn) {
  return Promise.all([
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
