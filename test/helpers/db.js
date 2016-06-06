import r from '../../db/connect'

function truncateDBTables() {
  return r.tableList()
    .then(tables => tables.filter(t => !t.startsWith('_')))
    .then(tablesToTruncate => Promise.all(tablesToTruncate.map(t => r.table(t).delete().run())))
    .catch(e => console.error('truncateDBTables ERROR: ', e))
}

/* eslint-env mocha */
export function withDBCleanup() {
  beforeEach(truncateDBTables)
}
