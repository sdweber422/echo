import {normalize, Schema, arrayOf} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const LOAD_CHAPTERS_REQUEST = 'LOAD_CHAPTERS_REQUEST'
export const LOAD_CHAPTERS_SUCCESS = 'LOAD_CHAPTERS_SUCCESS'
export const LOAD_CHAPTERS_FAILURE = 'LOAD_CHAPTERS_FAILURE'

const chaptersSchema = arrayOf(new Schema('chapters'))

export default function loadChapters() {
  return {
    types: [
      LOAD_CHAPTERS_REQUEST,
      LOAD_CHAPTERS_SUCCESS,
      LOAD_CHAPTERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
  query {
    getAllChapters {
      id
      name
      channelName
      timezone
      goalRepositoryURL
      cycleDuration
      cycleEpoch
      inviteCodes
    }
  }
        `,
        variables: {},
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getAllChapters)
        .then(chapters => normalize(chapters, chaptersSchema))
    },
    payload: {},
  }
}
