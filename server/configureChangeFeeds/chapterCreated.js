/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {connect} from 'src/db'
import {handleConnectionError} from './util'

const r = connect()

export default function chapterCreated(chapterCreatedQueue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(chapterCreatedQueue), handleConnectionError, {
    changefeedName: 'chapter created',
  })
}

function _getFeed() {
  return r.table('chapters').changes()
    .filter(r.row('old_val').eq(null))
}

function _getFeedProcessor(chapterCreatedQueue) {
  return ({new_val: chapter}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 60000},
    }
    chapterCreatedQueue.add(chapter, jobOpts)
  }
}
