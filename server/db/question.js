import r from '../../db/connect'

export function getQuestionById(id) {
  return r.table('questions').get(id).run()
}

export function getQuestionsBySubjectType(subjectType) {
  return r.table('questions').filter({subjectType}).run()
}

