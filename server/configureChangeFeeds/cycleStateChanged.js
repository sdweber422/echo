/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default function cycleStateChanged(cycleStateChangedQueues) {
  r.table('cycles').changes()
    .filter(r.row('new_val')('state').ne(r.row('old_val')('state')))
    .then(cursor => {
      cursor.each((err, {new_val: cycle, old_val: {state: old_state}}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }
        console.log(`Cycle state for ${cycle.id} changed from ${old_state} to ${cycle.state}`)
        cycleStateChangedQueues[cycle.state].add(cycle)
      })
    })
}

