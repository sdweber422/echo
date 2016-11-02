import {
  LOAD_ALL_PLAYERS_REQUEST,
  LOAD_ALL_PLAYERS_SUCCESS,
  LOAD_ALL_PLAYERS_FAILURE,
} from 'src/common/actions/loadAllPlayersAndCorrespondingUsers'
import {
  REASSIGN_PLAYERS_TO_CHAPTER_REQUEST,
  REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS,
  REASSIGN_PLAYERS_TO_CHAPTER_FAILURE,
} from 'src/common/actions/reassignPlayersToChapter'

import {mergeEntities} from 'src/common/util'

const initialState = {
  players: {},
  isBusy: false,
}

export function players(state = initialState, action) {
  switch (action.type) {
    case LOAD_ALL_PLAYERS_REQUEST:
    case REASSIGN_PLAYERS_TO_CHAPTER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_ALL_PLAYERS_SUCCESS:
    case REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS:
      {
        const players = mergeEntities(state.players, action.response.entities.players)
        return Object.assign({}, state, {
          isBusy: false,
          players,
        })
      }
    case LOAD_ALL_PLAYERS_FAILURE:
    case REASSIGN_PLAYERS_TO_CHAPTER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
