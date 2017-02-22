import {
  FIND_SURVEYS_REQUEST,
  FIND_SURVEYS_SUCCESS,
  FIND_SURVEYS_FAILURE,
  GET_SURVEY_REQUEST,
  GET_SURVEY_SUCCESS,
  GET_SURVEY_FAILURE,
  SAVE_SURVEY_RESPONSES_REQUEST,
  SAVE_SURVEY_RESPONSES_SUCCESS,
  SAVE_SURVEY_RESPONSES_FAILURE,
  SET_SURVEY_GROUP,
} from 'src/common/actions/types'

const initialState = {
  isBusy: true,
  groupIndex: 0,
  data: [],
}

export default function surveys(state = initialState, action) {
  switch (action.type) {
    case SET_SURVEY_GROUP:
      return Object.assign({}, state, {groupIndex: action.groupIndex})

    case FIND_SURVEYS_REQUEST:
    case GET_SURVEY_REQUEST:
    case SAVE_SURVEY_RESPONSES_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })

    case FIND_SURVEYS_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: action.response,
      })

    case GET_SURVEY_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
        data: [action.response],
      })

    case FIND_SURVEYS_FAILURE:
    case GET_SURVEY_FAILURE:
    case SAVE_SURVEY_RESPONSES_FAILURE:
    case SAVE_SURVEY_RESPONSES_SUCCESS:
      return Object.assign({}, state, {
        isBusy: false,
      })

    default:
      return state
  }
}
