export class BadInputError extends Error {
  constructor(message) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = 'BadInputError'
    this.message = message
  }
}
