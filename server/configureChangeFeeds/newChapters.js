/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from 'src/db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default function newChapters(newChapterQueue) {
  r.table('chapters').changes().filter(r.row('old_val').eq(null))
    .then(cursor => {
      cursor.each((err, {new_val: chapter}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }
        // console.log('adding new chapter to newChapter queue:', chapter)
        newChapterQueue.add(chapter)
      })
    })
}
