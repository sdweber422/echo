/* eslint-disable no-console, camelcase */
import {PROJECT_STATES} from 'src/common/models/project'
import {processStateChangefeed} from './util'

export default function projectStateChanged(projectStateChangedQueues) {
  processStateChangefeed({
    tableName: 'projects',
    changefeedName: 'project state changed',
    states: PROJECT_STATES,
    queues: projectStateChangedQueues,
  })
}
