/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {validateResponse} from '../response'
import r from '../../../db/connect'
// import factory from '../../../test/factories'

describe(testContext(__filename), function () {

  describe('validateResponse()', function () {

    describe('percentage type responses', function () {
      describe('multi-subject', function () {
        it('validates that values add up to 100')
      })

      describe('single subject', function () {
        it('validates that value between 0 and 100')
      })
    })
  })
})
