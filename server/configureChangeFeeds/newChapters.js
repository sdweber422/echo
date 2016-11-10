/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {connect} from 'src/db'
import {handleConnectionError} from './util'

const r = connect()

export default function newChapters(newChapterQueue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(newChapterQueue), handleConnectionError, {
    changefeedName: 'new chapters',
  })
}

function _getFeed() {
  return r.table('chapters').changes()
    .filter(r.row('old_val').eq(null))
}

function _getFeedProcessor(newChapterQueue) {
  return ({new_val: chapter}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 60000},
    }
    newChapterQueue.add(chapter, jobOpts)
  }
}
