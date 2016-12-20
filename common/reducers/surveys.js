import {
  FIND_RETRO_SURVEYS_REQUEST,
  FIND_RETRO_SURVEYS_SUCCESS,
  FIND_RETRO_SURVEYS_FAILURE,
  GET_RETRO_SURVEY_REQUEST,
  GET_RETRO_SURVEY_SUCCESS,
  GET_RETRO_SURVEY_FAILURE,
  SURVEY_PARSE_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
} from 'src/common/actions/survey'

const initialState = {
  groupIndex: null,
  isBusy: true,
  error: null,
  retro: [],
}

export function surveys(state = initialState, action) {
  switch (action.type) {
    case FIND_RETRO_SURVEYS_REQUEST:
    case GET_RETRO_SURVEY_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case SAVE_SURVEY_RESPONSES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
        groupIndex: action.groupIndex,
      })

    case FIND_RETRO_SURVEYS_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
        retro: action.response,
      })

    case GET_RETRO_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
        retro: [action.response],
      })

    case SAVE_SURVEY_RESPONSES_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        error: null,
      })

    case FIND_RETRO_SURVEYS_FAILURE:
    case GET_RETRO_SURVEY_FAILURE:
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
