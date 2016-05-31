/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import validate from '../percentage'

describe(testContext(__filename), function () {
  describe('validate()', function () {
    beforeEach(function () {
      this.response = {}
      this.responseType = 'percentage'
      this.validateResult =
        () => validate(this.response, this.responseType)

      this.expectResponseToValidate =
        () => expect(this.validateResult()).to.eventually.eq(this.response)

      this.expectResponseToNotValidate =
        () => expect(this.validateResult()).to.be.rejected
    })

    describe('multi-subject', function () {
      beforeEach(function () {
        this.response.subject = Array.from(Array(4).keys())
      })

      it('validates a valid response', function () {
        this.response.value = [25, 25, 25, 25]
        return this.expectResponseToValidate()
      })
      it('ensures values add up to 100', function () {
        this.response.value = [50, 50, 50, 50]
        return this.expectResponseToNotValidate()
      })
      it('ensures a value for each subject', function () {
        this.response.value = [50, 25, 25]
        return this.expectResponseToNotValidate()
      })
    })

    describe('single subject', function () {
      beforeEach(function () {
        this.response.subject = 'some-player-id'
      })

      it('validates that value is between 0 and 100', function () {
        this.response.value = 50
        return this.expectResponseToValidate()
      })
      it('returns a rejected promise on failure', function () {
        this.response.value = 101
        return this.expectResponseToNotValidate()
      })
    })
  })
})
