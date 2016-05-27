import r from '../../db/connect'

export function saveResponse(responseToSave) {
  return validateResponse(responseToSave)
    .then(response => saveValidatedResponse(response))
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
  const {questionId, subject, surveyId} = responseToSave

  if (surveyId) {
    return getResponse({questionId, subject, surveyId}).then(existingResponse => {
      if (existingResponse) {
        const newResponse = Object.assign({}, existingResponse, responseToSave, {updatedAt: r.now()})
        return r.table('responses').get(newResponse.id).update(newResponse).run()
      }
      return r.table('responses').insert(responseToSave).run()
    })
  }
  return r.table('responses').insert(responseToSave).run()
}

function getResponse({questionId, surveyId, subject}) {
  return r.table('responses').getAll([questionId, subject, surveyId], {index: 'questionSubjectSurvey'}).run()
    .then(results => results[0])
}
