import fetch from 'isomorphic-fetch'

import config from 'src/config'
import {graphQLErrorHandler} from 'src/common/util/getGraphQLFetcher'
import {serverToServerJWT} from 'src/server/util/jwt'

export function graphQLFetcher(baseURL, lgJWT = serverToServerJWT()) {
  return graphQLParams => {
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${lgJWT}`,
        'Origin': config.server.baseURL,
        'Content-Type': 'application/json',
        'LearnersGuild-Skip-Update-User-Middleware': 1,
      },
      body: JSON.stringify(graphQLParams),
    }

    return fetch(`${baseURL}/graphql`, options)
      .then(resp => {
        if (!resp.ok) {
          return Promise.reject(`GraphQL request resulted in an ERROR: ${resp.statusText}`)
        }
        return resp.json()
      })
      .then(graphQLErrorHandler)
  }
}
