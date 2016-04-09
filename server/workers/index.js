import later from 'later'
import createQueue from 'bull'
import url from 'url'

import {serverToServerJWT, graphQLFetcher} from '../util'

if (process.env.NODE_ENV === 'development') {
  require('dotenv').load()
}

const redisConfig = url.parse(process.env.REDIS_URL)
/* eslint-disable camelcase */
const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : undefined
const syncPlayersWithIDM = createQueue('syncPlayersWithIDM', redisConfig.port, redisConfig.hostname, redisOpts)
const syncPlayersWithIDMSched = later.parse.recur().every(1).minute()
later.setInterval(() => {
  console.log('here')
  syncPlayersWithIDM.add({}, {attempts: 1})
}, syncPlayersWithIDMSched)

function processUsers(users) {
  // TODO: add users with role 'player' to database and associate them with the chapter whose inviteCode matches
  console.log('recent users:', users)
}

syncPlayersWithIDM.process((/* job */) => {
  const since = new Date(0).toISOString() // TODO: get this from our DB
  const graphQLParams = {
    query: `
query ($since: DateTime!) {
  getUsersCreatedSince(since: $since) {
    id
    inviteCode
    email
    handle
  }
}
    `,
    variables: {
      since,
    },
  }
  graphQLFetcher(serverToServerJWT(), process.env.IDM_BASE_URL)(graphQLParams)
    .then(resp => resp.json())
    .then(graphQLResponse => {
      if (graphQLResponse.errors && graphQLResponse.errors.length) {
        // throw the first error
        throw new Error(graphQLResponse.errors[0].message)
      }
      processUsers(graphQLResponse.data.getUsersCreatedSince)
    })
    .catch(error => {
      console.error(error.stack)
      throw error
    })
})
