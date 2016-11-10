import url from 'url'
import express from 'express'
import toureiro from 'toureiro'

import config from 'src/config'
import {userCan} from 'src/common/util'

const app = new express.Router()
const redisConfig = url.parse(config.server.redis.url)
const redisPasswordOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : {} // eslint-disable-line camelcase
const toureiroApp = toureiro({
  redis: {
    host: redisConfig.hostname,
    port: redisConfig.port,
    ...redisPasswordOpts,
  },
})

app.use(
  '/job-queues',
  (req, res, next) => {
    if (!req.user || !userCan(req.user, 'monitorJobQueues')) {
      throw new Error('You are not authorized to do that.')
    }
    next()
  },
  toureiroApp
)

export default app
