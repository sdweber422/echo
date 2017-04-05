import getSurveyById from './getSurveyById'
import excludeQuestionsAboutRespondent from './excludeQuestionsAboutRespondent'
import inflateQuestionRefs from './inflateQuestionRefs'

export default function getFullSurveyForPlayerById(playerId, surveyId) {
  const surveyQuery = excludeQuestionsAboutRespondent(getSurveyById(surveyId), playerId)
  return inflateQuestionRefs(playerId, surveyQuery)
}
