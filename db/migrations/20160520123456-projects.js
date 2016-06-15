/* eslint-disable no-var */
var config = require('../config')

var createOptions = config.createOptions
config()

exports.up = function up(r, conn) {
  return r.tableCreate('projects', createOptions)
    .run(conn)
    .then(() => r.table('projects').indexCreate('chapterId').run(conn))
    .then(() => r.table('projects').indexCreate('name').run(conn))
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.tableDrop('projects').run(conn),
  ])
}
