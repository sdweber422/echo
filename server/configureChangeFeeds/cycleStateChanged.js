/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default function cycleStateChanged(cycleStateChangedQueues) {
  r.table('cycles').changes()
    .filter(
      r.row('old_val').eq(null)  // new cycles
        .or(r.row('new_val')('state').ne(r.row('old_val')('state')))  // cycle state changes
    )
    .then(cursor => {
      cursor.each((err, {new_val: cycle, old_val: cycleBeforeChange}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }
        const previousState = cycleBeforeChange ? cycleBeforeChange.state : '(not yet created)'
        console.log(`Cycle state for ${cycle.id} changed from ${previousState} to ${cycle.state}`)
        const queue = cycleStateChangedQueues[cycle.state]
        if (queue) {
          queue.add(cycle)
        }
      })
    })
}
