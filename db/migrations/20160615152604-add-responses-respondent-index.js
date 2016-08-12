/* eslint-disable no-var */
var config = require('src/db/config')

config()

exports.up = function up(r, conn) {
  return Promise.all([
    r.table('responses').indexDrop('playerId').run(conn),
    r.table('responses').indexDrop('questionIdAndSubjectIdAndSurveyId').run(conn),
    r.table('responses').indexCreate('questionIdAndRespondentIdAndSurveyId', [
      r.row('questionId'),
      r.row('respondentId'),
      r.row('surveyId'),
    ]).run(conn),
  ])
}

exports.down = function down(r, conn) {
  return Promise.all([
    r.table('responses').indexDrop('questionIdAndRespondentIdAndSurveyId').run(conn),
    r.table('responses').indexCreate('questionIdAndSubjectIdAndSurveyId', [
      r.row('questionId'),
      r.row('subject'),
      r.row('surveyId'),
    ]).run(conn),
    r.table('responses').indexCreate('playerId').run(conn),
  ])
}
