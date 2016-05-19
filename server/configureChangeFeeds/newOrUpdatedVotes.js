/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default function newOrUpdatedVotes(newOrUpdatedVotesQueue) {
  // votes without githubIssue information are either new or updated
  r.table('votes').changes()
    .filter(r.row('new_val')('pendingValidation').eq(true))
    .then(cursor => {
      cursor.each((err, {new_val: vote}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }
        // console.log('adding vote to vote queue:', vote)
        newOrUpdatedVotesQueue.add(vote)
      })
    })
}
