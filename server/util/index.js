import url from 'url'
import jwt from 'jsonwebtoken'
import fetch from 'isomorphic-fetch'
import getBullQueue from 'bull'
import socketCluster from 'socketcluster-client'

import config from 'src/config'
import {graphQLErrorHandler} from 'src/common/util/getGraphQLFetcher'

const JWT_ISSUER = 'learnersguild.org'

// TODO: fix this! we're effectively using module caching to create a singleton. yuck.
let socket = null

export function serverToServerJWT() {
  /* eslint-disable camelcase */
  const now = Math.floor(Date.now() / 1000)
  const claims = {
    iss: JWT_ISSUER,
    iat: now,
    exp: now + (60 * 10),  // 10 minutes from now
    sub: 0,
    name: 'Server-to-Server Authentication',
    preferred_username: '__server_to_server__',
    email: 'noreply@learnersguild.org',
    emails: 'noreply@learnersguild.org',
    roles: 'backoffice',
  }
  return jwt.sign(claims, config.server.jwt.privateKey, {algorithm: config.server.jwt.algorithm})
}

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

export function getQueue(queueName) {
  const redisConfig = url.parse(config.server.redis.url)
  /* eslint-disable camelcase */
  const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : undefined
  return getBullQueue(queueName, redisConfig.port, redisConfig.hostname, redisOpts)
}

export function getSocket() {
  if (socket) {
    return socket
  }

  socket = socketCluster.connect({hostname: config.server.sockets.host})
  socket.on('connect', () => console.log('... socket connected'))
  socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
  socket.on('connectAbort', () => null)
  socket.on('error', error => console.warn(error.message))

  return socket
}

export function sum(values) {
  if (!Array.isArray(values)) {
    return null
  }
  return values.reduce((result, n) => result + n, 0)
}

export function toArray(val) {
  if (Array.isArray(val)) {
    return val
  }
  if (val instanceof Map) {
    return Array.from(val.values())
  }
  return [val]
}

export function pickRandom(arr) {
  if (!Array.isArray(arr)) {
    return null
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

export function shuffle(arr) {
  const shuffled = toArray(arr)

  let j
  let x
  for (let i = shuffled.length; i; i--) {
    j = Math.floor(Math.random() * i)
    x = shuffled[i - 1]
    shuffled[i - 1] = shuffled[j]
    shuffled[j] = x
  }

  return shuffled
}
