import r from '../r'

export default function getSurveyResponsesForPlayer(respondentId, surveyId, questionId, subjectIds) {
  const responseExpr = r.table('responses').getAll([
    questionId,
    respondentId,
    surveyId
  ], {index: 'questionIdAndRespondentIdAndSurveyId'})

  if (subjectIds) {
    return responseExpr.filter(response => subjectIds.contains(response('subjectId')))
  }

  return responseExpr
}
