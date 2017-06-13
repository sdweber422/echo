import r from '../r'
import getStatById from './getStatById'
import getQuestionById from './getQuestionById'

export default async function findLatestFeedbackResponses({respondentId, subjectId}) {
  return r.table('responses')
    .filter({subjectId, respondentId})
    .merge(_mergeStatDescriptor)
    .filter(_hasStatDescriptor)
    .group('surveyId').ungroup()
    .map(group => ({
      surveyId: group('group'),
      responses: group('reduction'),
    }))
    .do(_sortBySurveyCreationDate)
    .nth(0).default({})('responses').default([])
}

function _mergeStatDescriptor(row) {
  return {statDescriptor: _getStatDescriptorForQuestion(row('questionId'))}
}

function _hasStatDescriptor(row) {
  return row.hasFields('statDescriptor')
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
