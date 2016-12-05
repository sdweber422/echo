import {connect} from 'src/db'

const r = connect()

class LGCustomQueryError extends Error {
  constructor(message) {
    super(message)
    this.message = message || 'There was a problem with the query.'
    this.name = 'LGCustomQueryError'
  }
}

export function parseQueryError(error) {
  if (error.name === 'ReqlUserError' || error.message.includes('LGCustomQueryError')) {
    const [, message] = error.message.match(/<LGCustomQueryError>(.*)<\/LGCustomQueryError>/)
    return new LGCustomQueryError(message)
  }
  return error
}

export function customQueryError(msg) {
  return r.error(`<LGCustomQueryError>${msg}</LGCustomQueryError>`)
}
