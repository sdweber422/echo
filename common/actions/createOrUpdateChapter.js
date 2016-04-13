import {Schema} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const CREATE_OR_UPDATE_CHAPTER_REQUEST = 'CREATE_OR_UPDATE_CHAPTER_REQUEST'
export const CREATE_OR_UPDATE_CHAPTER_SUCCESS = 'CREATE_OR_UPDATE_CHAPTER_SUCCESS'
export const CREATE_OR_UPDATE_CHAPTER_FAILURE = 'CREATE_OR_UPDATE_CHAPTER_FAILURE'


const schema = new Schema('chapters')

export default function createOrUpdateChapter(chapterData) {
  const responseDataAttribute = 'createOrUpdateChapter'
  const {cycleEpochDate, cycleEpochTime} = chapterData
  const cycleEpoch = new Date(cycleEpochDate)
  cycleEpoch.setUTCHours(cycleEpochTime.getUTCHours())
  cycleEpoch.setUTCMinutes(cycleEpochTime.getUTCMinutes())
  cycleEpoch.setUTCSeconds(0)
  cycleEpoch.setUTCMilliseconds(0)
  const actualChapterData = Object.assign({}, chapterData, {cycleEpoch})
  delete actualChapterData.cycleEpochDate
  delete actualChapterData.cycleEpochTime

  return {
    types: [
      CREATE_OR_UPDATE_CHAPTER_REQUEST,
      CREATE_OR_UPDATE_CHAPTER_SUCCESS,
      CREATE_OR_UPDATE_CHAPTER_FAILURE,
    ],
    responseDataAttribute,
    schema,
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = {
        query: `
  mutation ($chapter: InputChapter!) {
    ${responseDataAttribute}(chapter: $chapter) {
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
        variables: {
          chapter: actualChapterData,
        },
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(mutation)
    },
    payload: {chapterData},
  }
}
