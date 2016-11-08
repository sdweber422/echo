/* eslint-disable no-console, camelcase */
import {connect} from 'src/db'
import {responsesTable} from 'src/server/db/response'

import {processChangeFeedWithAutoReconnect} from './util'

const r = connect()

export default function surveyResponseSubmitted(queue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(queue), 'survey response submitted')
}

function _getFeed() {
  return responsesTable.changes()
    .filter(
      r.or(
        r.row('old_val').eq(null),
        r.row('new_val')('value').ne(r.row('old_val')('value'))
      )
    )
}

function _getFeedProcessor(queue) {
  return ({new_val: responseInfo}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 10000},
    }
    queue.add(responseInfo, jobOpts)
  }
}
