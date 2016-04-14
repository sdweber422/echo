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
      console.log('chapters:', chapters, id)
      const chapterData = chapters[id]
      if (!chapterData) {
        throw new Error("Can't add invite code to chapter before it's loaded!")
      }

      return createInviteCode(dispatch, auth, inviteCodeData)
        .then(graphQLResponse => graphQLResponse.data.createInviteCode)
        .then(inviteCode => {
          console.log('GOT HERE!', chapterData, inviteCode)
          const chapterInviteCodes = chapterData.inviteCodes || []
          chapterInviteCodes.push(inviteCode.code)
          console.log('chapterInviteCodes:', chapterInviteCodes)
          const actualChapterData = Object.assign({}, chapterData, {inviteCodes: chapterInviteCodes})
          console.log('actualChapterData:', actualChapterData)
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
          console.log('mutation:', mutation)
          return getGraphQLFetcher(dispatch, auth)(mutation)
        })
    },
    redirect: '/chapters',
    payload: {id, inviteCodeData},
  }
}
