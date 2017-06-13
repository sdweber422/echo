import r from '../r'
import getQuestionById from './getQuestionById'
import findSurveyResponsesForPlayer from './findSurveyResponsesForPlayer'

require('require-yaml') // eslint-disable-line import/no-unassigned-import

const SURVEY_RESPONSE_INSTRUCTIONS = require('src/data/survey-response-instructions.yaml')

export default function inflateQuestionRefs(playerId, surveyQuery) {
  return surveyQuery.merge(survey => ({
    questions: _mapRefsToQuestions(survey, playerId)
  }))
}

function _mapRefsToQuestions(survey, playerId) {
  return survey('questionRefs').map(ref =>
    getQuestionById(ref('questionId'))
      .merge(question => ({
        subjectIds: ref('subjectIds'),
        name: ref('name').default(null),
        responseInstructions: getResponseInstructionsByType(question('responseType')),
        response: _getResponse(playerId, survey('id'), ref),
      }))
  )
}

function _getResponse(playerId, surveyId, questionRef) {
  const responseQuery = findSurveyResponsesForPlayer(
    playerId,
    surveyId,
    questionRef('questionId'),
    questionRef('subjectIds'),
  )
  const subjectPosition = response => questionRef('subjectIds').offsetsOf(response('subjectId'))
  const responseValueList = responseQuery
    .orderBy(subjectPosition)
    .map(response => ({
      subjectId: response('subjectId'),
      value: response('value'),
    }))
    .coerceTo('array')
  return {values: responseValueList}
}

function getResponseInstructionsByType(type) {
  return r.expr(SURVEY_RESPONSE_INSTRUCTIONS)(type)
}
