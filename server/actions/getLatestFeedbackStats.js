import r from 'src/db/connect'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {getStatById} from 'src/server/db/stat'
import {getQuestionById} from 'src/server/db/question'

export default async function getLatestFeedbackStats({respondentId, subjectId}) {
  const responses = await _getFeedbackResponses({respondentId, subjectId})

  if (!responses || responses.length === 0) {
    return
  }

  return [
    STAT_DESCRIPTORS.TEAM_PLAY,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION,
    STAT_DESCRIPTORS.LEARNING_SUPPORT,
  ].reduce((result, stat) => {
    const response = responses.find(response => response.statDescriptor === stat)
    if (response) {
      result[stat] = response.value
    }
    return result
  }, {})
}

async function _getFeedbackResponses({respondentId, subjectId}) {
  const [responses] = await r.table('responses')
    .filter({subjectId, respondentId})
    .merge(_mergeStatDescriptor)
    .filter(_hasStatDescriptor)
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

function _hasStatDescriptor(row) {
  return row.hasFields('statDescriptor')
}

function _mergeStatDescriptor(row) {
  return {statDescriptor: _getStatDescriptorForQuestion(row('questionId'))}
}

function _getStatDescriptorForQuestion(questionId) {
  return getStatById(_getStatIdForQuestion(questionId))('descriptor').default(null)
}

function _getStatIdForQuestion(questionId) {
  return getQuestionById(questionId)('statId').default(null)
}
