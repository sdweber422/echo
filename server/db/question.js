import r from '../../db/connect'

export function getQuestionById(id) {
  return r.table('questions').get(id)
}

