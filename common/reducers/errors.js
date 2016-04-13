import {DISMISS_ERROR} from '../actions/dismissError'
import {AUTHORIZATION_ERROR} from '../actions/authorizationError'
import {CREATE_OR_UPDATE_CHAPTER_FAILURE} from '../actions/createOrUpdateChapter'

const initialState = {
  messages: [],
}

function appendMessage(state, message) {
  const messages = state.messages.slice(0)
  messages.push(message)
  return messages
}

function removeMessage(state, index) {
  const messages = state.messages.slice(0)
  messages.splice(index, 1)
  return messages
}

export function errors(state = initialState, action) {
  switch (action.type) {
    case DISMISS_ERROR:
      return Object.assign({}, state, {
        messages: removeMessage(state, action.index)
      })
    case AUTHORIZATION_ERROR:
      return Object.assign({}, state, {
        messages: appendMessage(state, action.error),
      })
    case CREATE_OR_UPDATE_CHAPTER_FAILURE:
      console.error(action.error)
      return Object.assign({}, state, {
        messages: appendMessage(state, action.error),
      })
    default:
      return state
  }
}
