import {normalize, Schema} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'

export const ADD_INVITE_CODE_TO_CHAPTER_REQUEST = 'ADD_INVITE_CODE_TO_CHAPTER_REQUEST'
export const ADD_INVITE_CODE_TO_CHAPTER_SUCCESS = 'ADD_INVITE_CODE_TO_CHAPTER_SUCCESS'
export const ADD_INVITE_CODE_TO_CHAPTER_FAILURE = 'ADD_INVITE_CODE_TO_CHAPTER_FAILURE'

const chapterSchema = new Schema('chapters')

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

  return getGraphQLFetcher(dispatch, auth, process.env.IDM_BASE_URL)(mutation)
    .then(graphQLResponse => graphQLResponse.data.createInviteCode)
}

export default function addInviteCodeToChapter(id, inviteCodeData) {
  // because invite codes are (rightfully) stored on the IDM service, we need to
  // first create the invite code there, then associate it with the chapter in
  // the game service

  return {
    types: [
      ADD_INVITE_CODE_TO_CHAPTER_REQUEST,
      ADD_INVITE_CODE_TO_CHAPTER_SUCCESS,
      ADD_INVITE_CODE_TO_CHAPTER_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const {auth, chapters: {chapters}} = getState()
      const chapterData = chapters[id]
      if (!chapterData) {
        throw new Error("Can't add invite code to chapter before it's loaded!")
      }

      return createInviteCode(dispatch, auth, inviteCodeData)
        .then(inviteCode => {
          const chapterInviteCodes = chapterData.inviteCodes || []
          chapterInviteCodes.push(inviteCode.code)
          const actualChapterData = Object.assign({}, chapterData, {inviteCodes: chapterInviteCodes})
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
          return getGraphQLFetcher(dispatch, auth)(mutation)
            .then(graphQLResponse => graphQLResponse.data.createOrUpdateChapter)
            .then(chapter => normalize(chapter, chapterSchema))
        })
    },
    redirect: `/chapters/${id}`,
    payload: {id, inviteCodeData},
  }
}
