import r from 'src/db/connect'

import {
  STATS_QUESTION_TYPES,
  filterQuestionsByType,
} from 'src/server/util/survey'

export default async function getLatestFeedbackStats({respondentId, subjectId}) {
  const responses = await r.table('responses')
    .filter({subjectId, respondentId})
    .group('surveyId').ungroup()
    .map(group => ({
      surveyId: group('group'),
      responses: group('reduction'),
    }))
   .merge(row => ({surveyCreatedAt: r.table('surveys').get(row('surveyId'))('createdAt')}))
   .orderBy(r.desc('surveyCreatedAt'))
   .nth(0)('responses')

  const questionIdsByStat = await _getQuestionIdsByStat()
  return [
    STATS_QUESTION_TYPES.TEAM_PLAY,
    STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION,
    STATS_QUESTION_TYPES.LEARNING_SUPPORT,
  ].reduce((result, stat) => {
    const response = responses.find(({questionId}) => questionIdsByStat[stat].has(questionId))
    result[stat] = response.value
    return result
  }, {})
}

async function _getQuestionIdsByStat() {
  const questions = await r.table('questions')
  const result = {}
  Object.values(STATS_QUESTION_TYPES).forEach(type => {
    result[type] = new Set(filterQuestionsByType(questions, type).map(_ => _.id))
  })
  return result
}
