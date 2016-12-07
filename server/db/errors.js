import {connect} from 'src/db'
import {LGCustomQueryError} from 'src/server/util/error'

const r = connect()

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
