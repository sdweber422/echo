import inflateQuestionRefs from './inflateQuestionRefs'
import getRetrospectiveSurveyForPlayer from './getRetrospectiveSurveyForPlayer'

export default function getFullRetrospectiveSurveyForPlayer(playerId, projectId) {
  const surveyQuery = getRetrospectiveSurveyForPlayer(playerId, projectId)
  return inflateQuestionRefs(playerId, surveyQuery)
}
