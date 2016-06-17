/* eslint-disable no-var */
var config = require('../config')

config()

exports.up = function up(r, conn) {
  return Promise.all([
    r.table('cycles').indexCreate('chapterId').run(conn),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.table('cycles').indexDrop('chapterId').run(conn),
  ])
}
