
import {
  LOAD_CYCLE_VOTING_RESULTS_SUCCESS,
  RECEIVED_CYCLE_VOTING_RESULTS,
} from '../actions/loadCycleVotingResults'

import {mergeEntities} from '../util'

const initialState = {
  cycles: {},
  isBusy: false,
}

export function cycles(state = initialState, action) {
  switch (action.type) {
    case LOAD_CYCLE_VOTING_RESULTS_SUCCESS:
    case RECEIVED_CYCLE_VOTING_RESULTS:
      {
        const cycles = mergeEntities(state.cycles, action.response.entities.cycles)
        return Object.assign({}, state, {
          isBusy: false,
          cycles,
        })
      }
    default:
      return state
  }
}
