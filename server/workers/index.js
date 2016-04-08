import later from 'later'
import createQueue from 'bull'
import url from 'url'

if (process.env.NODE_ENV === 'development') {
  require('dotenv').load()
}

const redisConfig = url.parse(process.env.REDIS_URL)
const syncPlayersWithIDM = createQueue('syncPlayersWithIDM', redisConfig.port, redisConfig.hostname, {url: process.env.REDIS_URL})
const syncPlayersWithIDMSched = later.parse.recur().every(1).minute()
const timer = later.setInterval(() => {
  syncPlayersWithIDM.add({dummy: 'data'}, {attempts: 3, backoff: {type: 'fixed', delay: 10000}})
}, syncPlayersWithIDMSched)

syncPlayersWithIDM.process(job => {
  console.log('syncPlayersWithIDM:', job.data)
})
