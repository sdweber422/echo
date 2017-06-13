/* eslint-disable no-console, camelcase */
import {PROJECT_STATES, CLOSED, CLOSED_FOR_REVIEW} from 'src/common/models/project'
import {changeFeedForProjectStateChanged} from 'src/server/services/dataService'
import {processStateChangefeed} from './util'

export default function projectStateChanged(projectStateChangedQueues) {
  processStateChangefeed({
    getFeed: changeFeedForProjectStateChanged,
    changefeedName: 'project state changed',
    states: PROJECT_STATES,
    outOfOrderStateTransitions: {
      [CLOSED]: [CLOSED_FOR_REVIEW]
    },
    queues: projectStateChangedQueues,
  })
}
