import later from 'later'
import createQueue from 'bull'
import url from 'url'

if (process.env.NODE_ENV === 'development') {
  require('dotenv').load()
}

const redisConfig = url.parse(process.env.REDIS_URL)
/* eslint-disable camelcase */
const redisOpts = redisConfig.auth ? {auth_pass: redisConfig.auth.split(':')[1]} : null
const syncPlayersWithIDM = createQueue('syncPlayersWithIDM', redisConfig.port, redisConfig.hostname, redisOpts)
const syncPlayersWithIDMSched = later.parse.recur().every(1).minute()
later.setInterval(() => {
  syncPlayersWithIDM.add({dummy: 'data'}, {attempts: 3, backoff: {type: 'fixed', delay: 10000}})
}, syncPlayersWithIDMSched)

syncPlayersWithIDM.process(job => {
  console.log('syncPlayersWithIDM:', job.data)
})
