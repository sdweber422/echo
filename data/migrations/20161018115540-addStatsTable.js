import config from 'src/config'

const createOptions = config.server.rethinkdb.tableCreation

export function up(r, conn) {
  return r.tableCreate('stats', createOptions).run(conn)
    .then(() => r.table('stats').indexCreate('descriptor').run(conn))
    .then(() => reloadSurveyAndQuestionData())
}

export function down(r, conn) {
  return Promise.all([
    r.tableDrop('stats').run(conn)
  ])
}

function reloadSurveyAndQuestionData() {
  const {Question, Stat, SurveyBlueprint} = require('src/server/services/dataService')
  return Promise.all([
    Question.syncData(),
    SurveyBlueprint.syncData(),
    Stat.syncData(),
  ])
}
