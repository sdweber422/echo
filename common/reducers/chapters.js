import {
  CREATE_OR_UPDATE_CHAPTER_REQUEST,
  CREATE_OR_UPDATE_CHAPTER_SUCCESS,
  CREATE_OR_UPDATE_CHAPTER_FAILURE
} from '../actions/createOrUpdateChapter'
import {
  LOAD_CHAPTER_REQUEST,
  LOAD_CHAPTER_SUCCESS,
  LOAD_CHAPTER_FAILURE,
} from '../actions/loadChapter'

const initialState = {
  chapters: {},
  isBusy: false,
}

export function chapters(state = initialState, action) {
  switch (action.type) {
    case LOAD_CHAPTER_REQUEST:
    case CREATE_OR_UPDATE_CHAPTER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_CHAPTER_SUCCESS:
    case CREATE_OR_UPDATE_CHAPTER_SUCCESS:
      {
        const chapters = Object.assign({}, state.chapters, action.response.entities.chapters)
        return Object.assign({}, state, {
          isBusy: false,
          chapters,
        })
      }
    case LOAD_CHAPTER_FAILURE:
    case CREATE_OR_UPDATE_CHAPTER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
