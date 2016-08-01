/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import path from 'path'
import glob from 'glob'

import configureCSSModules from '../../server/configureCSSModules'

const IGNORE_PATTERNS = [
  /__tests__.*\.test\.jsx?/,
  /client\/index\.jsx$/,
  /server\/index\.js$/,
  /server\/server\.js$/,
  /workers\/index\.js$/,
]

function shouldRequire(f) {
  const ignored = IGNORE_PATTERNS.reduce((ignored, pattern) => ignored || f.match(pattern), false)
  return f.match(/\.jsx?$/) && !ignored
}

function requireAllForCoverage() {
  const promises = [
    'client',
    'common',
    'config',
    'server',
    'test',
  ].map(dir => (
    new Promise(resolve => {
      const pattern = path.resolve(__dirname, '..', '..', dir, '**', '*.js*')
      glob(pattern, (err, files) => {
        if (err) {
          throw err
        }
        files.forEach(f => {
          if (shouldRequire(f)) {
            require(f)
          }
        })
        resolve()
      })
    })
  ))
  return Promise.all(promises)
}

describe('coverage statistics calculation', function () {
  it('reports accurately', function () {
    this.timeout(10000)
    configureCSSModules()
    return requireAllForCoverage()
  })
})
