/* eslint-disable no-var */

var config = require('../config')
var createOptions = config.createOptions

exports.up = function up(r, conn) {
  return Promise.all([
    r.tableCreate('cycles', createOptions)
      .run(conn)
      .then(() => {
        return Promise.all([
          r.table('cycles').indexCreate('chapterIdAndState', [r.row('chapterId'), r.row('state')]).run(conn),
        ])
      }),
    r.tableCreate('votes', createOptions)
      .run(conn)
      .then(() => {
        return Promise.all([
          r.table('votes').indexCreate('playerIdAndCycleId', [r.row('playerId'), r.row('cycleId')]).run(conn),
        ])
      }),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.tableDrop('votes').run(conn),
    r.tableDrop('cycles').run(conn),
  ])
}
