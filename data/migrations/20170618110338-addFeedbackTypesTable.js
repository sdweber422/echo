import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export function up(r, conn) {
  return r.tableCreate('feedbackTypes', createOptions).run(conn)
    .then(() => r.table('feedbackTypes').indexCreate('descriptor').run(conn))
    .then(() => reloadRelatedData())
}

export function down(r, conn) {
  return r.tableDrop('feedbackTypes').run(conn)
}

function reloadRelatedData() {
  const {Question, FeedbackType, SurveyBlueprint} = require('src/server/services/dataService')
  return Promise.all([
    Question.syncData(),
    SurveyBlueprint.syncData(),
    FeedbackType.syncData(),
  ])
}
