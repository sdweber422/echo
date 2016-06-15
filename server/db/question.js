import r from '../../db/connect'

export const questionsTable = r.table('questions')

export function getQuestionById(id) {
  return questionsTable.get(id)
}

export function getQuestionsBySubjectType(subjectType) {
  return questionsTable.filter({subjectType, active: true})
}

export function saveQuestion(question) {
  let questionWithTimestamps = Object.assign({}, question, {
    updatedAt: r.now(),
  })
  if (!question.createdAt) {
    questionWithTimestamps = Object.assign({}, questionWithTimestamps, {
      createdAt: r.now(),
    })
  }
  return questionsTable.get(question.id).replace(questionWithTimestamps)
}
