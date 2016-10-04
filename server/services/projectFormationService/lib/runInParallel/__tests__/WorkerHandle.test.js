/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {range} from '../../util'
import WorkerHandle from '../WorkerHandle'
import co from 'co'

describe(testContext(__filename), function () {
  it('manages a worker that can pull jobs from a generator', async function () {
    const results = []

    const jobGenerator = function*() {
      for (let i = 0; i <= 5; i++) {
        yield i
      }
    }

    const jobs = jobGenerator()
    const workerLib = `${__dirname}/exampleWorker.js`
    const onResult = (result, workerId) => results.push({result, workerId})

    const handle = new WorkerHandle(workerLib, 'workerId', jobs, onResult)
    await handle.run()

    expect(results.map(_ => _.result).sort()).to.deep.eq([
      1,
      2, 4,
      3, 6,  9,
      4, 8,  12, 16,
      5, 10, 15, 20, 25,
    ].sort())
  })

  it('can be used to send arbitrary messages to a worker', async function() {
    const results = []
    const jobs = (function *() { yield 1 })()
    const workerLib = `${__dirname}/messageReceivingWorker.js`
    const onResult = (result, workerId) => results.push(result)

    const handle = new WorkerHandle(workerLib, 'msgWorker', jobs, onResult)
    handle.run()
    handle.send('setFoo', 11)
    await handle.waitForExit()

    expect(results).to.deep.eq(['complete'])
  })
})
