/* eslint-disable no-console, camelcase */
import {connect} from 'src/db'

import {processChangeFeedWithAutoReconnect} from './util'

const r = connect()

export default function projectArtifactChanged(projectArtifactChangedQueue) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(projectArtifactChangedQueue), 'project artifact changed')
}

function _getFeed() {
  return r.table('projects').changes()
    .filter(row => {
      const origProject = row('old_val')
      const project = row('new_val')
      return r.or(
        r.and(
          r.not(origProject.hasFields('artifactURL')),
          project.hasFields('artifactURL')
        ),
        project('artifactURL').ne(origProject('artifactURL'))
      )
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
