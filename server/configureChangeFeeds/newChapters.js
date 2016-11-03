/* eslint-disable no-console, camelcase */
import raven from 'raven'
import config from 'src/config'
import {connect} from 'src/db'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

export default function newChapters(newChapterQueue) {
  r.table('chapters').changes().filter(r.row('old_val').eq(null))
    .then(cursor => {
      cursor.each((err, {new_val: chapter}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }

        const jobOpts = {
          attempts: 3,
          backoff: {type: 'fixed', delay: 60000},
        }
        newChapterQueue.add(chapter, jobOpts)
      })
    })
}
