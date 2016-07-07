import {getRetrospectiveSurveyForPlayer} from '../../server/db/survey'
import saveSurveyResponse from './saveSurveyResponse'

export default async function saveRetrospectiveCLISurveyResponseForPlayer(respondentId, {questionNumber, responseParams}, projectId) {
  const questionIndex = questionNumber - 1
  const survey = await getRetrospectiveSurveyForPlayer(respondentId, projectId)
  const {questionId, subject} = survey.questionRefs[questionIndex]

  return await saveSurveyResponse({
    respondentId,
    responseParams,
    surveyId: survey.id,
    questionId,
    subject,
  })
}
