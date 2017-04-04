import {
  APP_SHOW_LOADING,
  APP_HIDE_LOADING,
  AUTHORIZATION_ERROR,
  DISMISS_ERROR,
  FETCH_DATA_REQUEST,
  FETCH_DATA_FAILURE,
  FETCH_DATA_SUCCESS,
  UNLOCK_SURVEY_FAILURE,
  TOGGLE_DELETE_DIALOG,
} from 'src/common/actions/types'

const initialState = {
  isBusy: false,
  showLoading: false,
  showingDeleteDialog: false,
  errors: [],
}

export default function app(state = initialState, action) {
  switch (action.type) {
    case APP_SHOW_LOADING:
      return {...state, showLoading: true}

    case APP_HIDE_LOADING:
      return {...state, showLoading: false}

    case FETCH_DATA_REQUEST:
      return {...state, isBusy: true}

    case FETCH_DATA_SUCCESS:
      return {...state, isBusy: false}

    case AUTHORIZATION_ERROR:
    case FETCH_DATA_FAILURE:
    case UNLOCK_SURVEY_FAILURE:
      {
        console.error(action.type, action.message)
        return {
          ...state,
          isBusy: false,
          errors: appendErrorMessage(state, action.error),
        }
      }

    case DISMISS_ERROR:
      return Object.assign({}, state, {
        errors: removErroreMessage(state, action.index),
      })

    case TOGGLE_DELETE_DIALOG:
      {
        if (!/IN_PROGRESS/.test(action.project.state)) {
          return Object.assign({}, state, {
            errors: appendErrorMessage(state, 'Projects not IN_PROGRESS cannot be deleted.'),
          })
        }
        return Object.assign({}, state, {
          showingDeleteDialog: !state.showingDeleteDialog,
        })
      }

    default:
      return state
  }
}

function appendErrorMessage(state, errorMessage) {
  return [...state.errors, errorMessage]
}

function removErroreMessage(state, errorMessageIndex) {
  const errorMessages = [...state.errors]
  errorMessages.splice(errorMessageIndex, 1)
  return errorMessages
}
