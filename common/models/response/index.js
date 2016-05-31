const VALIDATORS = {
  percentage: require('./validators/percentage'),
}

export function validateResponse(response, responseType) {
  if (!VALIDATORS[responseType]) {
    return Promise.reject(Error(`Cannot validate unknown response type: ${responseType}`))
  }
  return VALIDATORS[responseType](response)
}
