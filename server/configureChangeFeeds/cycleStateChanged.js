/* eslint-disable no-console, camelcase */
import {CYCLE_STATES, PRACTICE} from 'src/common/models/cycle'
import {changeFeedForCycleStateChanged} from 'src/server/services/dataService'
import {processStateChangefeed} from './util'

export default function cycleStateChanged(cycleStateChangedQueues) {
  processStateChangefeed({
    getFeed: changeFeedForCycleStateChanged,
    changefeedName: 'cycle state changed',
    states: CYCLE_STATES,
    statesWithExtendedTimeout: [PRACTICE],
    queues: cycleStateChangedQueues,
  })
}
