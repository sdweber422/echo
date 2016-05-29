export function validateResponse(response, type) {
  if (!validators[type]) {
    return Promise.reject(Error(`Unknown Type: ${type}`))
  }
  const arity = Array.isArray(response.value) ? 'multi' : 'single'

  return validators[type][arity](response).then(() => response)
}

const validators = {
  percentage: {
    multi: (response) => {
      const {value: values, subject: subjects} = response
      if (values.length != subjects.length) {
        return Promise.reject(Error(`expected ${subjects.length} responses but got ${values.length}`))
      }
      const sum = values.reduce((a,b) => a + b, 0)
      if (sum != 100) {
        return Promise.reject(Error(`Percentages must add up to 100. Got ${sum}`))
      }
      return Promise.all(values.map(v => validators.percentage.single(v)))
    },
    single: (response) => {
      const {value} = response
      if (value > 100 || value < 0) {
        return Promise.reject(Error(`must be a percentage between 0 and 100`))
      }
      return Promise.resolve()
    }
  }
}
