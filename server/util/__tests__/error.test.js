/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {GraphQLError} from 'graphql/error'

import {
  LGCustomQueryError,
  LGNotAuthorizedError,
  formatServerError,
} from '../error'

describe(testContext(__filename), function () {
  describe('formatServerError()', function () {
    it('LGCustomQueryError: 400 status code, original message', function () {
      const message = 'Hey there hi there ho there'
      const original = new LGCustomQueryError(message)
      const formatted = formatServerError(original)
      _validateError(formatted, message, 400)
    })

    it('LGNotAuthorizedError: 401 status code, original message', function () {
      const message = 'Hey there hi there ho there'
      const original = new LGNotAuthorizedError(message)
      const formatted = formatServerError(original)
      _validateError(formatted, message, 401)
    })

    it('GraphQLError: 500 status code, internal server error, masked message, original error', function () {
      const original = new GraphQLError('Hay itz me')
      const formatted = formatServerError(original)
      _validateError(formatted, 'An internal server error occurred', 500)
      expect(formatted.originalError).to.deep.equal(original)
    })

    it('Error: 500 status code, internal server error, masked message', function () {
      const original = new Error('Wat')
      const formatted = formatServerError(original)
      _validateError(formatted, 'An internal server error occurred', 500)
      expect(formatted.originalError).to.deep.equal(original)
    })
  })
})

function _validateError(error, expectedMessage, expectedStatusCode) {
  expect(error.message).to.eq(expectedMessage)
  expect(error.statusCode).to.eq(expectedStatusCode)
}
