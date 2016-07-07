/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {
  default as randomMemorableName,
  FILTERED_WORDS,
} from '../randomMemorableName'

describe(testContext(__filename), function () {
  describe('randomMemorableName', function () {
    it('should return a hyphenated name with at least 2 words', function () {
      expect(randomMemorableName()).to.match(/\w+(-\w+)+/)
    })

    it('should not contain any filtered words', function () {
      FILTERED_WORDS.forEach(word => {
        const name = `abc-${word}-xyz`
        let returnedFiltered = false
        const nameGenerator = () => {
          const retVal = returnedFiltered ? 'safe-name' : name
          returnedFiltered = (retVal === name)
          return retVal
        }
        expect(randomMemorableName(nameGenerator)).to.equal('safe-name')
      })
    })
  })
})
