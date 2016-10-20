import r from 'src/db/connect'

import {STATS_QUESTION_TYPES} from 'src/server/util/survey'
import {getStatById} from 'src/server/db/stat'
import {getQuestionById} from 'src/server/db/question'

export default async function getLatestFeedbackStats({respondentId, subjectId}) {
  const responses = await _getFeedbackResponses({respondentId, subjectId})

  if (!responses || responses.length === 0) {
    return
  }

  return [
    STATS_QUESTION_TYPES.TEAM_PLAY,
    STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION,
    STATS_QUESTION_TYPES.LEARNING_SUPPORT,
  ].reduce((result, stat) => {
    const response = responses.find(response => response.statDescriptor === stat)
    result[stat] = response.value
    return result
  }, {})
}

async function _getFeedbackResponses({respondentId, subjectId}) {
  const [responses] = await r.table('responses')
    .filter({subjectId, respondentId})
    .merge(row => ({statDescriptor: _getStatDescriptorForQuestion(row('questionId'))}))
    .filter(row => row.hasFields('statDescriptor'))
    .group('surveyId').ungroup()
    .map(group => ({
      surveyId: group('group'),
      responses: group('reduction'),
    }))
    .do(_sortBySurveyCreationDate)
    .limit(1)('responses')

  return responses
}

function _sortBySurveyCreationDate(expr) {
  return expr.merge(row => ({
    surveyCreatedAt: r.table('surveys').get(row('surveyId'))('createdAt')
  }))
  .orderBy(r.desc('surveyCreatedAt'))
}

function _getStatDescriptorForQuestion(questionId) {
  return getStatById(_getStatIdForQuestion(questionId))('descriptor').default(null)
}

function _getStatIdForQuestion(questionId) {
  return getQuestionById(questionId)('statId').default(null)
}
