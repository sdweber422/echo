/* global __SERVER__ */
import fetch from 'isomorphic-fetch'

import {updateJWT} from 'src/common/actions/updateJWT'

const APP_BASE_URL = __SERVER__ ? process.env.APP_BASE_URL : ''

export default function getGraphQLFetcher(dispatch, auth, baseUrl = APP_BASE_URL, throwErrors = true) {
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

    console.log('\n\nGRAPHQL:', `${baseUrl}/graphql`, options)

    return fetch(`${baseUrl}/graphql`, options)
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
      .then(graphQLResponse => throwErrors ?
        graphQLErrorHandler(graphQLResponse) :
        graphQLResponse)
  }
}

export function graphQLErrorHandler(graphQLResponse) {
  if (graphQLResponse.errors && graphQLResponse.errors.length) {
    // throw the first error
    throw new Error(graphQLResponse.errors[0].message)
  }
  return graphQLResponse
}
