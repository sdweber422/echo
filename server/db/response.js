import r from '../../db/connect'

export function saveResponsesForSurveyQuestion(responses) {
  return replace(responses)
    .then(result => result.generated_keys)
    .catch(error => {
      throw error
    })
}

function replace(oneOrMoreResponses) {
  const responses = Array.isArray(oneOrMoreResponses) ?
    oneOrMoreResponses :
    [oneOrMoreResponses]

  const responsesWithTimestamps = responses.map(response => Object.assign({}, response, {
    createdAt: r.now(),
    updatedAt: r.now(),
  }))

  const {questionId, respondentId, surveyId} = responsesWithTimestamps[0]
  const responsesTable = r.table('responses')
  return responsesTable.getAll([
    questionId,
    respondentId,
    surveyId
  ], {index: 'questionIdAndRespondentIdAndSurveyId'})
    .delete()
    .then(() => responsesTable.insert(responsesWithTimestamps).run())
}
