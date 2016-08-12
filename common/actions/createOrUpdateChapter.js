import {normalize, Schema} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'

export const CREATE_OR_UPDATE_CHAPTER_REQUEST = 'CREATE_OR_UPDATE_CHAPTER_REQUEST'
export const CREATE_OR_UPDATE_CHAPTER_SUCCESS = 'CREATE_OR_UPDATE_CHAPTER_SUCCESS'
export const CREATE_OR_UPDATE_CHAPTER_FAILURE = 'CREATE_OR_UPDATE_CHAPTER_FAILURE'


const chapterSchema = new Schema('chapters')

export default function createOrUpdateChapter(chapterData) {
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
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const mutation = {
        query: `
  mutation ($chapter: InputChapter!) {
    createOrUpdateChapter(chapter: $chapter) {
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
        .then(graphQLResponse => graphQLResponse.data.createOrUpdateChapter)
        .then(chapter => normalize(chapter, chapterSchema))
    },
    redirect: '/chapters',
    payload: {chapterData},
  }
}
