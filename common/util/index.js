import fetch from 'isomorphic-fetch'

import {updateJWT} from '../actions/updateJWT'

/* global __SERVER__ */
const APP_BASEURL = __SERVER__ ? process.env.APP_BASEURL : ''

export function getGraphQLFetcher(dispatch, auth, throwErrors = true) {
  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphQLParams),
    }
    if (auth.lgJWT) {
      options.headers = Object.assign(options.headers, {
        Authorization: `Bearer ${auth.lgJWT}`,
      })
    }

    return fetch(`${APP_BASEURL}/graphql`, options)
      .then(resp => {
        if (!resp.ok) {
          console.error('GraphQL ERROR:', resp.statusText)
          if (throwErrors) {
            throw new Error(`GraphQL ERROR: ${resp.statusText}`)
          }
        }
        // for sliding-sessions, update our JWT from the LearnersGuild-JWT header
        const lgJWT = resp.headers.get('LearnersGuild-JWT')
        if (lgJWT) {
          dispatch(updateJWT(lgJWT))
        }
        return resp.json()
      })
      .then(graphQLResponse => {
        if (graphQLResponse.errors && graphQLResponse.errors.length) {
          if (throwErrors) {
            // throw the first error
            throw new Error(graphQLResponse.errors[0].message)
          }
        }
        return graphQLResponse
      })
  }
}

const CAPABILITY_ROLES = {
  createChapter: [
    'backoffice',
  ],
  editChapter: [
    'backoffice',
  ],
  listChapters: [
    'backoffice',
    'moderator',
  ],
  createInviteCode: [
    'backoffice',
  ],
  editCycleDuration: [
    'backoffice',
    'moderator',
  ],
}

export function userCan(currentUser, capability) {
  // console.log('user', currentUser.name, 'can', capability, '?')
  if (!currentUser) {
    // console.log(false)
    return false
  }
  const {roles} = currentUser
  if (!roles) {
    // console.log(false)
    return false
  }
  if (!CAPABILITY_ROLES[capability]) {
    // console.log(false)
    return false
  }
  const permitted = roles.filter(role => (
    CAPABILITY_ROLES[capability].indexOf(role) >= 0
  )).length > 0

  // console.log(permitted)
  return permitted
}
