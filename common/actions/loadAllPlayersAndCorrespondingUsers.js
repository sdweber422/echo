import {normalize, Schema, arrayOf} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'
import loadUsers from './loadUsers'

export const LOAD_ALL_PLAYERS_REQUEST = 'LOAD_ALL_PLAYERS_REQUEST'
export const LOAD_ALL_PLAYERS_SUCCESS = 'LOAD_ALL_PLAYERS_SUCCESS'
export const LOAD_ALL_PLAYERS_FAILURE = 'LOAD_ALL_PLAYERS_FAILURE'

const chapterSchema = new Schema('chapters')
const playerSchema = new Schema('players')
playerSchema.define({chapter: chapterSchema})
const playersSchema = arrayOf(playerSchema)

function loadAllPlayers() {
  return {
    types: [
      LOAD_ALL_PLAYERS_REQUEST,
      LOAD_ALL_PLAYERS_SUCCESS,
      LOAD_ALL_PLAYERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query {
  getAllPlayers {
    id
    chapter {
      id
      name
      channelName
      timezone
      cycleDuration
      cycleEpoch
      inviteCodes
    }
    createdAt
    updatedAt
  }
}
        `,
        variables: {},
      }

      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getAllPlayers)
        .then(players => normalize(players, playersSchema))
    },
    payload: {},
  }
}

export default function loadAllPlayersAndCorrespondingUsers() {
  return (dispatch, getState) => {
    return dispatch(loadAllPlayers())
      .then(() => {
        const playerIds = Object.keys(getState().players.players)
        return dispatch(loadUsers(playerIds))
      })
  }
}
