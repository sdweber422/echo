/* eslint-disable no-console, camelcase */
import {PROJECT_STATES} from 'src/common/models/project'
import {changefeedForProjectStateChanged} from 'src/server/services/dataService'
import {processStateChangefeed} from './util'

export default function projectStateChanged(projectStateChangedQueues) {
  processStateChangefeed({
    getFeed: changefeedForProjectStateChanged,
    changefeedName: 'project state changed',
    states: PROJECT_STATES,
    queues: projectStateChangedQueues,
  })
}
