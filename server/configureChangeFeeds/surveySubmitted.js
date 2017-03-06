/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {connect} from 'src/db'
import {handleConnectionError} from './util'

const r = connect()

export default function surveySubmitted(queue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(queue), handleConnectionError, {
    changefeedName: 'survey submitted',
  })
}

function _getFeed() {
  return r.table('surveys').changes()
    .filter(
      r.and(
        r.row('old_val').eq(null).not(),
        r.row('new_val')('completedBy').default([]).count().default(0)
          .gt(r.row('old_val')('completedBy').default([]).count().default(0))
      )
    )
}

function _getFeedProcessor(queue) {
  return ({old_val, new_val}) => {
    const completedByOld = old_val.completedBy || []
    const completedByNew = new_val.completedBy || []
    const newRespondentId = completedByNew.find(u => !completedByOld.includes(u.id))
    queue.add({
      survey: new_val,
      respondentId: newRespondentId,
    }, {
      attempts: 3,
      backoff: {type: 'fixed', delay: 10000},
    })
  }
}
