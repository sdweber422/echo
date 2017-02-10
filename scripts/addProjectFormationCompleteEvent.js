import {Cycle} from 'src/server/services/dataService'

const {finish} = require('./util')

run()
  .then(() => finish(null))
  .catch(err => finish(err))

async function run() {
  const cycle = await Cycle.filter({cycleNumber: 29}).nth(0)
  const queueService = require('src/server/services/queueService')
  const projectFormationQueue = queueService.getQueue('projectFormationComplete')
  const jobOpts = {
    attempts: 3,
    backoff: {type: 'fixed', delay: 10000},
  }
  console.log('cycle', cycle)
  await projectFormationQueue.add(cycle, jobOpts)
  console.log('cycle placed in queue')
}
