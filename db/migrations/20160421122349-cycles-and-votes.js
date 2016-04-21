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
          r.table('cycles').indexCreate('startTimestamp').run(conn),
        ])
      }),
    // r.tableCreate('votes', createOptions)
    //   .run(conn)
    //   .then(() => {
    //     return r.table('votes').indexCreate('chapterId').run(conn)
    //   }),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    // r.tableDrop('votes').run(conn),
    r.tableDrop('cycles').run(conn),
  ])
}
