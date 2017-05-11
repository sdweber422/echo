import r from '../r'
import getStatById from './getStatById'
import getQuestionById from './getQuestionById'

export default async function findFeedbackResponses({respondentId, subjectId}) {
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
