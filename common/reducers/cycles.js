import {
  LOAD_CYCLE_REQUEST,
  LOAD_CYCLE_SUCCESS,
  LOAD_CYCLE_FAILURE,
} from '../actions/loadCycle'

import {mergeEntities} from '../util'

const initialState = {
  cycles: {},
  isBusy: false,
}

export function cycles(state = initialState, action) {
  switch (action.type) {
    case LOAD_CYCLE_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_CYCLE_SUCCESS:
      {
        const cycles = mergeEntities(state.cycles, action.response.entities.cycles)
        return Object.assign({}, state, {
          isBusy: false,
          cycles,
        })
      }
    case LOAD_CYCLE_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
