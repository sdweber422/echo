import {Schema} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const LOAD_CHAPTER_REQUEST = 'LOAD_CHAPTER_REQUEST'
export const LOAD_CHAPTER_SUCCESS = 'LOAD_CHAPTER_SUCCESS'
export const LOAD_CHAPTER_FAILURE = 'LOAD_CHAPTER_FAILURE'


const schema = new Schema('chapters')

export default function loadChapter(id) {
  const responseDataAttribute = 'getChapterById'
  return {
    types: [
      LOAD_CHAPTER_REQUEST,
      LOAD_CHAPTER_SUCCESS,
      LOAD_CHAPTER_FAILURE,
    ],
    responseDataAttribute,
    schema,
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
  query ($id: ID!) {
    ${responseDataAttribute}(id: $id) {
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
        variables: {id},
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
    },
    payload: {id},
  }
}
