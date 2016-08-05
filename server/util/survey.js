export const STATS_QUESTION_TYPES = {
  RELATIVE_CONTRIBUTION: 'RELATIVE_CONTRIBUTION',
  LEARNING_SUPPORT: 'LEARNING_SUPPORT',
  CULTURE_CONTRIBUTION: 'CULTURE_CONTRIBUTION',
  PROJECT_HOURS: 'PROJECT_HOURS',
  GENERAL_FEEDBACK: 'GENERAL_FEEDBACK',
}

export function groupResponsesBySubject(surveyResponses) {
  return surveyResponses.reduce((result, response) => {
    const {subjectId} = response

    if (!result.has(subjectId)) {
      result.set(subjectId, [])
    }
    result.get(subjectId).push(response)

    return result
  }, new Map())
}

export function filterQuestionsByType(questions, questionType) {
  // eek. see https://github.com/LearnersGuild/game/issues/370
  switch (questionType) {
    case STATS_QUESTION_TYPES.RELATIVE_CONTRIBUTION:
      return questions.find(q => {
        return q.responseType === 'relativeContribution'
      }) || {}

    case STATS_QUESTION_TYPES.LEARNING_SUPPORT:
      return questions.find(q => {
        return q.subjectType === 'player' &&
          q.responseType === 'likert7Agreement' &&
          q.body.includes('supported me in learning my craft')
      }) || {}

    case STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION:
      return questions.find(q => {
        return q.subjectType === 'player' &&
          q.responseType === 'likert7Agreement' &&
          q.body.includes('contributed positively to our team culture')
      }) || {}

    case STATS_QUESTION_TYPES.PROJECT_HOURS:
      return questions.find(q => {
        return q.subjectType === 'project' &&
          q.responseType === 'text' &&
          q.body.includes('how many hours')
      }) || {}

    case STATS_QUESTION_TYPES.GENERAL_FEEDBACK:
      return questions.find(q => {
        return q.subjectType === 'player' && q.responseType === 'text'
      }) || {}

    default:
      return {}
  }
}
