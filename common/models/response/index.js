export function validateResponse(response, responseType) {
  if (!validators[responseType]) {
    return Promise.reject(Error(`Unknown Type: ${responseType}`))
  }
  return validators[responseType](response)
}

const validators = {
  percentage: require('./validators/percentage'),
}
