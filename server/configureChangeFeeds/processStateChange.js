/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {connect} from 'src/db'
import {handleConnectionError} from './util'

const r = connect()

export default function processStateChange(tableName, changefeedName, states, initialState, queues) {
  return processChangeFeedWithAutoReconnect(
    _getFeed(tableName),
    _getFeedProcessor(changefeedName, states, initialState, queues),
    handleConnectionError,
    {
      changefeedName: `${changefeedName}`
    }
  )
}

function _getFeed(table) {
  return r.table(table).changes()
    .filter(
      r.row('old_val').eq(null)  // new rows
        .or(r.row('new_val')('state').ne(r.row('old_val')('state')))  // state changes
    )
}

function _getFeedProcessor(changefeedName, states, initialState, queues) {
  return ({new_val, old_val}) => {
    // if there was no previous value, that means this is a new row
    const previousState = old_val ? old_val.state : '(not yet created)'
    const categoryName = changefeedName.charAt(0).toUpperCase() + changefeedName.slice(1)
    console.log(`${categoryName} state for ${new_val.id} changed from ${previousState} to ${new_val.state}`)
    const queue = queues[new_val.state]

    if (queue) {
      // setting the previous state index to -1 in the case that this is a new row ensures that
      // stateChangeIsInOrder will evaluate to true below
      const previousStateIndex = old_val ? states.indexOf(old_val.state) : -1
      const newStateIndex = states.indexOf(new_val.state)
      const stateChangeIsInOrder = previousStateIndex === newStateIndex - 1

      if (stateChangeIsInOrder) {
        let jobOpts
        if (new_val.state === initialState) {
          jobOpts = {timeout: 60 * 60000}
        } else {
          jobOpts = {
            attempts: 3,
            backoff: {type: 'fixed', delay: 10000},
          }
        }
        queue.add(changefeedName, jobOpts)
      } else {
        console.log('Ignoring out of order state change; not adding job to queue')
      }
    }
  }
}
