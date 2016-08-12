/* eslint-disable no-var */
var config = require('src/db/config')

config()

exports.up = function up(r, conn) {
  return r.table('surveyBlueprints').replace(
    r.row.merge(row => ({
      defaultQuestionRefs: row('defaultQuestionIds').map(questionId => ({questionId}))
    }))
    .without('defaultQuestionIds')
  ).run(conn)
}

exports.down = function down(r, conn) {
  return r.table('surveyBlueprints').replace(
    r.row.merge(row => ({
      defaultQuestionIds: row('defaultQuestionRefs').map(ref => ref('questionId'))
    }))
    .without('defaultQuestionRefs')
  ).run(conn)
}
