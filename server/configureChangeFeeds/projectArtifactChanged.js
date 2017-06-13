/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {changefeedForProjectArtifactChanged} from 'src/server/services/dataService'
import {handleConnectionError} from './util'

export default function projectArtifactChanged(projectArtifactChangedQueue) {
  processChangeFeedWithAutoReconnect(changefeedForProjectArtifactChanged, _getFeedProcessor(projectArtifactChangedQueue), handleConnectionError, {
    changefeedName: 'project artifact changed',
  })
}

function _getFeedProcessor(projectArtifactChangedQueue) {
  return ({new_val: project}) => {
    const jobOpts = {
      attempts: 3,
      backoff: {type: 'fixed', delay: 10000},
    }
    projectArtifactChangedQueue.add(project, jobOpts)
  }
}
