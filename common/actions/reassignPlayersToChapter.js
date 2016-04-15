import {normalize, arrayOf, Schema} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const REASSIGN_PLAYERS_TO_CHAPTER_REQUEST = 'REASSIGN_PLAYERS_TO_CHAPTER_REQUEST'
export const REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS = 'REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS'
export const REASSIGN_PLAYERS_TO_CHAPTER_FAILURE = 'REASSIGN_PLAYERS_TO_CHAPTER_FAILURE'


const playersSchema = arrayOf(new Schema('players'))

export default function reassignPlayersToChapter(playerIds, chapterId) {
  return {
    types: [
      REASSIGN_PLAYERS_TO_CHAPTER_REQUEST,
      REASSIGN_PLAYERS_TO_CHAPTER_SUCCESS,
      REASSIGN_PLAYERS_TO_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = {
        query: `
  mutation ($playerIds: [ID], $chapterId: ID!) {
    reassignPlayersToChapter(playerIds: $playerIds, chapterId: $chapterId) {
      id
      chapterId
    }
  }
        `,
        variables: {
          playerIds,
          chapterId,
        },
      }
      const {auth} = getState()
      return getGraphQLFetcher(dispatch, auth)(mutation)
        .then(graphQLResponse => graphQLResponse.data.reassignPlayersToChapter)
        .then(players => normalize(players, playersSchema))
    },
    redirect: '/players',
    payload: {playerIds, chapterId},
  }
}
