export * from './chapter'
export * from './cycle'
export * from './inviteCode'

export function validationErrorToReduxFormErrors(error) {
  const errorMap = {}
  error.errors.forEach(msg => {
    const [, field, message] = msg.match(/(\w+)\s+(.*)/)
    errorMap[field] = message
  })
  return errorMap
}
