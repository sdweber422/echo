/* eslint-disable no-console, camelcase */
import {connect} from 'src/db'

import {processChangeFeedWithAutoReconnect} from './util'

const r = connect()

export default function newChapters(newChapterQueue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(newChapterQueue), 'new chapters')
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
