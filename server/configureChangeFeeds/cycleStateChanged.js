/* eslint-disable no-console, camelcase */
import {CYCLE_STATES, PRACTICE} from 'src/common/models/cycle'
import processStateChange from './processStateChange'

export default function cycleStateChanged(cycleStateChangedQueues) {
  return processStateChange('cycles', 'cycle', CYCLE_STATES, PRACTICE, cycleStateChangedQueues)
}
