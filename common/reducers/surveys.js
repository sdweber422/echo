import {
  LOAD_RETRO_SURVEY_REQUEST,
  LOAD_RETRO_SURVEY_SUCCESS,
  LOAD_RETRO_SURVEY_FAILURE,
  SURVEY_PARSE_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
} from '../actions/survey'

import {mergeEntities} from '../util'

const initialState = {
  groupIndex: null,
  isBusy: true,
  error: null,
  retro: {},
}

export function surveys(state = initialState, action) {
  switch (action.type) {
    case LOAD_RETRO_SURVEY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case SAVE_SURVEY_RESPONSES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
        groupIndex: action.groupIndex,
      })

    case LOAD_RETRO_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
        retro: mergeEntities(state.retro, action.response),
      })

    case SAVE_SURVEY_RESPONSES_SUCCESS:
      // TODO: handle response value
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
      })

    case LOAD_RETRO_SURVEY_FAILURE:
    case SURVEY_PARSE_FAILURE:
    case SAVE_SURVEY_RESPONSES_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
        error: action.error,
      })

    default:
      return state
  }
}
