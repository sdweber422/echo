import url from 'url'
import express from 'express'
import matadorApp from 'bull-ui/app'

import config from 'src/config'
import {userCan} from 'src/common/util'

const app = new express.Router()
const redisConfig = url.parse(config.server.redis.url)
const redisPasswordOpts = redisConfig.auth ? {password: redisConfig.auth.split(':')[1]} : {}
const matador = matadorApp({
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
    req.basepath = res.locals.basepath = '/job-queues'
    next()
  },
  matador
)

export default app
