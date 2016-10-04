/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {runInParallel} from '../runInParallel'

describe(testContext(__filename), function () {
  it('works (hehe)', async function () {
    const results = []

    const jobGenerator = function*() {
      for (let i = 0; i <= 5; i++) {
        yield i
      }
    }

    await runInParallel({
      workerCount: 6,
      jobs: jobGenerator(),
      workerLib: `${__dirname}/exampleWorker.js`,
      onResult: (result, workerId) => results.push({result, workerId}),
    })

    expect(results.map(_ => _.result).sort()).to.deep.eq([
      1,
      2, 4,
      3, 6,  9,
      4, 8,  12, 16,
      5, 10, 15, 20, 25,
    ].sort())
  })
})
