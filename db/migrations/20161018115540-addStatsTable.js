/* eslint-disable no-var */
var config = require('src/db/config')
var reloadSurveyAndQuestionData = require('src/server/actions/reloadSurveyAndQuestionData')

var createOptions = config.createOptions
config()

exports.up = function up(r, conn) {
  return r.tableCreate('stats', createOptions).run(conn)
    .then(() => r.table('stats').indexCreate('descriptor').run(conn))
    .then(() => reloadSurveyAndQuestionData())
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.tableDrop('stats').run(conn)
  ])
}
