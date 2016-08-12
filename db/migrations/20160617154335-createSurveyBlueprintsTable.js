/* eslint-disable no-var */
var config = require('src/db/config')

var createOptions = config.createOptions
config()

exports.up = function up(r, conn) {
  return r.tableCreate('surveyBlueprints', createOptions).run(conn)
    .then(() => r.table('surveyBlueprints').indexCreate('descriptor').run(conn))
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.tableDrop('surveyBlueprints').run(conn)
  ])
}
