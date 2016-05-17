/* eslint-disable no-var */

var config = require('../config')
var createOptions = config.createOptions
config()

exports.up = function up(r, conn) {
  return Promise.all([
    r.tableCreate('moderators', createOptions)
      .run(conn)
      .then(() => {
        return r.table('moderators').indexCreate('chapterId').run(conn)
      }),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.tableDrop('players').run(conn),
  ])
}
