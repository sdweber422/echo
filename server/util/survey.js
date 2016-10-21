export function groupResponsesBySubject(surveyResponses) {
  return surveyResponses.reduce((result, response) => {
    const {subjectId} = response

    if (!result.has(subjectId)) {
      result.set(subjectId, [])
    }
    result.get(subjectId).push(response)

    return result
  }, new Map())
}
