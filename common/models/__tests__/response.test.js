/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {validateResponse} from '../response'

describe(testContext(__filename), function () {
  describe('validateResponse()', function () {
    // These tests are just to verify the plumbing.
    // Edge case testing is done in common/models/response/validators/__tests__
    it('validates a valid response', function () {
      const response = {value: 88, subject: 'some-id'}
      const result = validateResponse(response, 'percentage')
      return expect(result).to.eventually.eq(response)
    })
    it('rejects an invalid response', function () {
      const response = {value: 101, subject: 'some-id'}
      const result = validateResponse(response, 'percentage')
      return expect(result).to.be.rejected
    })
  })
})
