import {
  LOAD_PLAYERS_REQUEST,
  LOAD_PLAYERS_SUCCESS,
  LOAD_PLAYERS_FAILURE,
} from '../actions/loadPlayers'
import {
  REASSIGN_PLAYERS_TO_CHAPTER_REQUEST,
  REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS,
  REASSIGN_PLAYERS_TO_CHAPTER_FAILURE,
} from '../actions/reassignPlayersToChapter'

import {mergeEntities} from '../util'

const initialState = {
  players: {},
  isBusy: false,
}

export function players(state = initialState, action) {
  switch (action.type) {
    case LOAD_PLAYERS_REQUEST:
    case REASSIGN_PLAYERS_TO_CHAPTER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_PLAYERS_SUCCESS:
    case REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS:
      {
        const players = mergeEntities(state.players, action.response.entities.players)
        return Object.assign({}, state, {
          isBusy: false,
          players,
        })
      }
    case LOAD_PLAYERS_FAILURE:
    case REASSIGN_PLAYERS_TO_CHAPTER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
