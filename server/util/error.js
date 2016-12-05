import {GraphQLError} from 'graphql/error'

import {parseQueryError} from 'src/server/db/errors'

export function formatServerError(origError) {
  const queryError = parseQueryError(origError)

  if (queryError.name === 'BadInputError' || queryError.name === 'LGCustomQueryError') {
    return _badRequestError(queryError)
  } else if (/Reql\w+Error/.test(origError.name) || (origError.originalError &&
      /Reql\w+Error/.test(origError.originalError.name))) {
    // RethinkDb errors masked as internal errors
    return _internalServerError(origError)
  } else if (origError.name === 'BadRequestError') {
    return _badRequestError(origError)
  } else if (!(origError instanceof GraphQLError)) {
    // any other non-graphql error masked as internal error
    return _internalServerError()
  }

  return origError
}

function _badRequestError(origError) {
  const error = new Error()
  error.statusCode = origError.code || 400
  error.message = origError.message
  error.originalError = origError
  return error
}

function _internalServerError(origError) {
  const maskedError = new Error()
  maskedError.statusCode = 500
  maskedError.message = 'An internal server error occurred'
  maskedError.originalError = origError
  return maskedError
}
