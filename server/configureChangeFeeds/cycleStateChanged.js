/* eslint-disable no-console, camelcase */
import raven from 'raven'
import config from 'src/config'
import {connect} from 'src/db'
import {CYCLE_STATES, PRACTICE} from 'src/common/models/cycle'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

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
        // if there was no previous cycle, that means this is a new cycle
        const previousState = cycleBeforeChange ? cycleBeforeChange.state : '(not yet created)'
        console.log(`Cycle state for ${cycle.id} changed from ${previousState} to ${cycle.state}`)
        const queue = cycleStateChangedQueues[cycle.state]

        if (queue) {
          // setting the previous state index to -1 in the case that this is a new cycle ensures that
          // stateChangeIsInOrder will evaluate to true below
          const previousStateIndex = cycleBeforeChange ? CYCLE_STATES.indexOf(cycleBeforeChange.state) : -1
          const newStateIndex = CYCLE_STATES.indexOf(cycle.state)
          const stateChangeIsInOrder = previousStateIndex === newStateIndex - 1

          if (stateChangeIsInOrder) {
            const timeoutOpts = PRACTICE === cycle.state ? {timeout: 60 * 60000} : {}
            const jobOpts = {
              attempts: 3,
              backoff: {type: 'fixed', delay: 10000},
              ...timeoutOpts
            }
            queue.add(cycle, jobOpts)
          } else {
            console.log('Ignoring out of order state change; not adding job to queue')
          }
        }
      })
    })
}
