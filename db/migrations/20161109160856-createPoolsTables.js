import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export function up(r, conn) {
  return Promise.all([
    r.tableCreate('pools', createOptions).run(conn),
    r.tableCreate('players_pools', {...createOptions, primaryKey: 'playerId'}).run(conn)
  ])
}

export function down(r, conn) {
  return Promise.all([
    r.tableDrop('pools').run(conn),
    r.tableDrop('players_pools').run(conn),
  ])
}
