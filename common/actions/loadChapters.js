import {Schema, arrayOf} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const LOAD_CHAPTERS_REQUEST = 'LOAD_CHAPTERS_REQUEST'
export const LOAD_CHAPTERS_SUCCESS = 'LOAD_CHAPTERS_SUCCESS'
export const LOAD_CHAPTERS_FAILURE = 'LOAD_CHAPTERS_FAILURE'


const schema = new Schema('chapters')

export default function loadChapters() {
  const responseDataAttribute = 'getAllChapters'
  return {
    types: [
      LOAD_CHAPTERS_REQUEST,
      LOAD_CHAPTERS_SUCCESS,
      LOAD_CHAPTERS_FAILURE,
    ],
    responseDataAttribute,
    schema: arrayOf(schema),
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
  query {
    ${responseDataAttribute} {
      id
      name
      channelName
      timezone
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
    },
    payload: {},
  }
}
