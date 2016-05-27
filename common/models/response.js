import r from '../../db/connect'

export function saveResponse(responseToSave) {
  return validateResponse(responseToSave)
    .then(saveValidatedResponse)
}

function validateResponse(response) {
  return Promise.resolve(response)
}

function saveValidatedResponse(responseToSave) {
  if (Array.isArray(responseToSave.value)) {
    return saveMultiResponse(responseToSave)
  }
  else {
    return saveSingleResponse(responseToSave)
  }
}

function saveMultiResponse(responseToSave) {
  const values = responseToSave.value
  const subjects = responseToSave.subject

  return Promise.all(
    subjects.map((subject, i) => {
      const singleResponse = Object.assign({}, responseToSave, { subject, value: values[i] })
      return saveSingleResponse(singleResponse)
    })
  )
}

function saveSingleResponse(responseToSave) {
  const upsert = (id, oldResponse, newResponse) => {
    return oldResponse
      .merge(newResponse)
      .merge({updatedAt: r.now()})
  }

  return r.table('responses').insert(responseToSave, {conflict: upsert}).run()
}
