/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {connect} from 'src/db'
import {handleConnectionError} from './util'

const r = connect()

export default function voteSubmitted(voteSubmittedQueue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(voteSubmittedQueue), handleConnectionError, {
    changefeedName: 'vote submitted',
  })
}

function _getFeed() {
  return r.table('votes').changes()
    .filter(r.row('new_val')('pendingValidation').eq(true))
}

function _getFeedProcessor(voteSubmittedQueue) {
  return ({new_val: vote}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 5000},
    }
    voteSubmittedQueue.add(vote, jobOpts)
  }
}
