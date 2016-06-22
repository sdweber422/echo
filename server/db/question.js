import r from '../../db/connect'
import {replaceInTable} from '../../server/db/util'

export const questionsTable = r.table('questions')

export function getQuestionById(id) {
  return questionsTable.get(id)
}

export function getActiveQuestionsByIds(ids) {
  return questionsTable.getAll(...ids).filter({active: true})
}

export function saveQuestion(question, options) {
  return replaceInTable(question, questionsTable, options)
}
