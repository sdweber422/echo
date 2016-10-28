import config from 'src/config'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

const createOptions = config.server.rethinkdb.tables

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
