import {Schema} from 'normalizr'

import {getGraphQLFetcher} from '../util'

export const ADD_INVITE_CODE_TO_CHAPTER_REQUEST = 'ADD_INVITE_CODE_TO_CHAPTER_REQUEST'
export const ADD_INVITE_CODE_TO_CHAPTER_SUCCESS = 'ADD_INVITE_CODE_TO_CHAPTER_SUCCESS'
export const ADD_INVITE_CODE_TO_CHAPTER_FAILURE = 'ADD_INVITE_CODE_TO_CHAPTER_FAILURE'

const schema = new Schema('chapters')


function createInviteCode(dispatch, auth, inviteCode) {
  const mutation = {
    query: `
mutation ($inviteCode: InputInviteCode!) {
  createInviteCode(inviteCode: $inviteCode) {
    id
    code
  }
}
    `,
    variables: {
      inviteCode,
    },
  }
  /* global __DEVELOPMENT__ */
  const baseUrl = __DEVELOPMENT__ ? 'http://idm.learnersguild.dev' : 'https://idm.learnersguild.org'
  return getGraphQLFetcher(dispatch, auth, baseUrl)(mutation)
}

export default function addInviteCodeToChapter(id, inviteCodeData) {
  const responseDataAttribute = 'createOrUpdateChapter'
  return {
    types: [
      ADD_INVITE_CODE_TO_CHAPTER_REQUEST,
      ADD_INVITE_CODE_TO_CHAPTER_SUCCESS,
      ADD_INVITE_CODE_TO_CHAPTER_FAILURE,
    ],
    responseDataAttribute,
    schema,
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const {auth, chapters: {chapters}} = getState()
      const chapterData = chapters[id]
      if (!chapterData) {
        throw new Error("Can't add invite code to chapter before it's loaded!")
      }

      return createInviteCode(dispatch, auth, inviteCodeData)
        .then(graphQLResponse => graphQLResponse.data.createInviteCode)
        .then(inviteCode => {
          const chapterInviteCodes = chapterData.inviteCodes || []
          chapterInviteCodes.push(inviteCode.code)
          const actualChapterData = Object.assign({}, chapterData, {inviteCodes: chapterInviteCodes})
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
          return getGraphQLFetcher(dispatch, auth)(mutation)
        })
    },
    redirect: `/chapters/${id}`,
    payload: {id, inviteCodeData},
  }
}
