/* eslint-disable no-var */
var config = require('src/db/config')

config()

exports.up = function up(r, conn) {
  return r.table('projects').replace(
    r.row.merge(row => ({
      cycleHistory: row('history')
    })).without('history')
  ).run(conn)
}

exports.down = function down(r, conn) {
  return r.table('projects').replace(
    r.row.merge(row => ({
      history: row('cycleHistory')
    })).without('cycleHistory')
  ).run(conn)
}
