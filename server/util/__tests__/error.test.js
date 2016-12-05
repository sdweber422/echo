/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {GraphQLError} from 'graphql/error'

import {LGCustomQueryError} from 'src/server/db/errors'

import {formatServerError} from '../error'

describe(testContext(__filename), function () {
  describe('formatServerError()', function () {
    it('Error: 500 status code, internal server error, masked message', function () {
      const original = new Error('Wat')
      const formatted = formatServerError(original)
      _validateError(formatted, 'An internal server error occurred', 500)
    })

    it('LGCustomQueryError: 400 status code, bad request, original message', function () {
      const message = 'Hey there hi there ho there'
      const original = new LGCustomQueryError(message)
      const formatted = formatServerError(original)
      _validateError(formatted, message, 400)
      expect(formatted.originalError).to.deep.equal(original)
    })

    it('GraphQLError: original error', function () {
      const original = new GraphQLError('Hay itz me')
      const formatted = formatServerError(original)
      expect(formatted).to.deep.equal(original)
    })
  })
})

function _validateError(error, expectedMessage, expectedStatusCode) {
  expect(error.message).to.eq(expectedMessage)
  expect(error.statusCode).to.eq(expectedStatusCode)
}
