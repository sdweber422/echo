import {
  QUESTION_SUBJECT_TYPES,
  QUESTION_RESPONSE_TYPES,
} from 'src/common/models/survey'

export const STATS_QUESTION_TYPES = {
  RELATIVE_CONTRIBUTION: 'RELATIVE_CONTRIBUTION',
  LEARNING_SUPPORT: 'LEARNING_SUPPORT',
  TEAM_PLAY: 'TEAM_PLAY',
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

export function findQuestionByType(questions, questionType) {
  if (!Array.isArray(questions)) {
    return null
  }

  return filterQuestionsByType(questions, questionType)[0]
}

export function filterQuestionsByType(questions, questionType) {
  if (!Array.isArray(questions)) {
    return []
  }

  switch (questionType) {
    case STATS_QUESTION_TYPES.RELATIVE_CONTRIBUTION:
      return questions.filter(q => _isStatsQuestionRC(q))

    case STATS_QUESTION_TYPES.LEARNING_SUPPORT:
      return questions.filter(q => _isStatsQuestionLS(q))

    case STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION:
      return questions.filter(q => _isStatsQuestionCC(q))

    case STATS_QUESTION_TYPES.TEAM_PLAY:
      return questions.filter(q => _isStatsQuestionTP(q))

    case STATS_QUESTION_TYPES.PROJECT_HOURS:
      return questions.filter(q => _isStatsQuestionHours(q))

    case STATS_QUESTION_TYPES.GENERAL_FEEDBACK:
      return questions.filter(q => _isStatsQuestionGeneral(q))

    default:
      return []
  }
}

function _isStatsQuestionRC(question) {
  return question.responseType === 'relativeContribution'
}

function _isStatsQuestionLS(question) {
  return question.subjectType === QUESTION_SUBJECT_TYPES.PLAYER &&
    question.responseType === QUESTION_RESPONSE_TYPES.LIKERT_7 &&
    (question.body.includes('supported me in learning my craft') ||
      question.body.includes('better software developer'))
}

function _isStatsQuestionCC(question) {
  return question.subjectType === QUESTION_SUBJECT_TYPES.PLAYER &&
    question.responseType === QUESTION_RESPONSE_TYPES.LIKERT_7 &&
    question.body.includes('contributed positively to our team culture')
}

function _isStatsQuestionTP(question) {
  return question.subjectType === QUESTION_SUBJECT_TYPES.PLAYER &&
    question.responseType === QUESTION_RESPONSE_TYPES.LIKERT_7 &&
    question.body.includes('world class team player')
}

function _isStatsQuestionHours(question) {
  return question.subjectType === QUESTION_SUBJECT_TYPES.PROJECT &&
    question.responseType === QUESTION_RESPONSE_TYPES.NUMERIC &&
    question.body.includes('how many hours')
}

function _isStatsQuestionGeneral(question) {
  return question.subjectType === QUESTION_SUBJECT_TYPES.PLAYER &&
    question.responseType === QUESTION_RESPONSE_TYPES.TEXT
}
