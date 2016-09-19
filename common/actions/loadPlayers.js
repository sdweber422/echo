import {normalize, Schema, arrayOf} from 'normalizr'

import {getGraphQLFetcher, mergeEntities} from 'src/common/util'

export const LOAD_PLAYERS_REQUEST = 'LOAD_PLAYERS_REQUEST'
export const LOAD_PLAYERS_SUCCESS = 'LOAD_PLAYERS_SUCCESS'
export const LOAD_PLAYERS_FAILURE = 'LOAD_PLAYERS_FAILURE'

const chapterSchema = new Schema('chapters')
const usersSchema = arrayOf(new Schema('users'))
const playerSchema = new Schema('players')
playerSchema.define({chapter: chapterSchema})
const playersSchema = arrayOf(playerSchema)

function getAllPlayers(dispatch, auth) {
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

  return getGraphQLFetcher(dispatch, auth)(query)
}

export default function loadPlayers() {
  // because some player information is stored with the IDM service (such as
  // player name, handle, etc.), we need to make two API requests -- one to our
  // own service and one to IDM to get the user info; then, we'll merge it all

  return {
    types: [
      LOAD_PLAYERS_REQUEST,
      LOAD_PLAYERS_SUCCESS,
      LOAD_PLAYERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const {auth} = getState()

      return getAllPlayers(dispatch, auth)
        .then(graphQLResponse => graphQLResponse.data.getAllPlayers)
        .then(players => {
          const query = {
            query: `
      query ($ids: [ID]) {
        getUsersByIds(ids: $ids) {
          id
          email
          name
          handle
          dateOfBirth
          timezone
        }
      }
            `,
            variables: {
              ids: players.map(player => player.id),
            },
          }

          const normalizedPlayers = normalize(players, playersSchema)

          return getGraphQLFetcher(dispatch, auth, process.env.IDM_BASE_URL)(query)
            .then(graphQLResponse => graphQLResponse.data.getUsersByIds)
            .then(users => {
              const normalizedUsers = normalize(users, usersSchema)
              // merge the user info from IDM and our player info
              const mergedPlayers = mergeEntities(normalizedUsers.entities.users, normalizedPlayers.entities.players)
              return Object.assign({}, normalizedPlayers, {entities: {players: mergedPlayers}})
            })
        })
    },
    payload: {},
  }
}
