/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'
import {PRACTICE} from '../../common/models/cycle'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default function cycleLaunched(cycleLaunchedQueue) {
  r.table('cycles').changes()
    .filter(r.row('new_val')('state').eq(PRACTICE))
    .then(cursor => {
      cursor.each((err, {new_val: cycle}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }
        cycleLaunchedQueue.add(cycle)
      })
    })
}
