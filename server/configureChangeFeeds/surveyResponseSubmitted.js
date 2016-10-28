/* eslint-disable no-console, camelcase */
import raven from 'raven'
import config from 'src/config'
import {connect} from 'src/db'
import {responsesTable} from 'src/server/db/response'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

export default function surveyResponseSubmitted(queue) {
  surveyResponsesFeed()
    .pluck('respondentId', 'surveyId')
    .then(cursor => {
      cursor.each((err, responseInfo) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }
        console.log(`Survey [${responseInfo.surveyId}] Response Submitted By [${responseInfo.respondentId}]`)
        queue.add(responseInfo)
      })
    })
}

function surveyResponsesFeed() {
  return responsesTable.changes()
    .filter(
      r.or(
        r.row('old_val').eq(null),
        r.row('new_val')('value').ne(r.row('old_val')('value'))
      )
    )
    .map(changes => changes('new_val'))
}
