import {
  LOAD_CYCLE_GOALS_REQUEST,
  LOAD_CYCLE_GOALS_SUCCESS,
  LOAD_CYCLE_GOALS_FAILURE,
  RECEIVED_CYCLE_GOALS,
} from '../actions/loadCycleGoals'

const initialState = {
  cycleGoals: {},
  isBusy: false,
}

export function cycleGoals(state = initialState, action) {
  switch (action.type) {
    case LOAD_CYCLE_GOALS_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_CYCLE_GOALS_SUCCESS:
    case RECEIVED_CYCLE_GOALS:
      {
        const cycleGoals = Object.assign({}, state.cycleGoals, action.response.cycleGoals)
        return Object.assign({}, state, {
          isBusy: false,
          cycleGoals,
        })
      }
    case LOAD_CYCLE_GOALS_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
