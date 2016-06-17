import Promise from 'bluebird'

import r from '../../db/connect'

function truncateDBTables() {
  console.log('db connections (avail / total):', r.getPoolMaster().getAvailableLength(), '/', r.getPoolMaster().getLength())
  return r.tableList()
    .then(tables => tables.filter(t => !t.startsWith('_')))
    .then(tablesToTruncate => Promise.each(tablesToTruncate, t => r.table(t).delete().run()))
}

/* eslint-env mocha */
export function withDBCleanup() {
  beforeEach(truncateDBTables)
}
