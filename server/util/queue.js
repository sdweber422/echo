import url from 'url'
import getBullQueue from 'bull'

import config from 'src/config'

export function getQueue(queueName) {
  const redisConfig = url.parse(config.server.redis.url)
  /* eslint-disable camelcase */
  const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : undefined
  return getBullQueue(queueName, redisConfig.port, redisConfig.hostname, redisOpts)
}

export function emptyQueue(queueName) {
  return getQueue(queueName).empty()
}
