/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'
import {responsesTable} from '../../server/db/response'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

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
