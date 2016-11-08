/* eslint-disable no-console, camelcase */
import {connect} from 'src/db'

import {processChangeFeedWithAutoReconnect} from './util'

const r = connect()

export default function newOrUpdatedVotes(newOrUpdatedVotesQueue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(newOrUpdatedVotesQueue), 'new or updated votes')
}

function _getFeed() {
  return r.table('votes').changes()
    .filter(r.row('new_val')('pendingValidation').eq(true))
}

function _getFeedProcessor(newOrUpdatedVotesQueue) {
  return ({new_val: vote}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 5000},
    }
    newOrUpdatedVotesQueue.add(vote, jobOpts)
  }
}
