export default function validate(response) {
  if (Array.isArray(response.value)) {
    return validateMultiValue(response).then(() => response)
  }
  return validateSingleValue(response).then(() => response)
}

function validateMultiValue(response) {
  const {value: values, subject: subjects} = response
  if (values.length !== subjects.length) {
    return Promise.reject(Error(`expected ${subjects.length} responses but got ${values.length}`))
  }
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum !== 100) {
    return Promise.reject(Error(`Percentages must add up to 100. Got ${sum}`))
  }
  return Promise.all(values.map(v => validateSingleValue(v)))
}

function validateSingleValue(response) {
  const {value} = response
  if (value > 100 || value < 0) {
    return Promise.reject(Error(`must be a percentage between 0 and 100`))
  }
  return Promise.resolve()
}
