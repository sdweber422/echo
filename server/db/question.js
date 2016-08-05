import r from '../../db/connect'
import {replaceInTable} from '../../server/db/util'

export const questionsTable = r.table('questions')

export function getQuestionById(id) {
  return questionsTable.get(id)
}

export function getActiveQuestionsByIds(ids) {
  return questionsTable.getAll(...ids).filter({active: true})
}

export function findQuestionsByIds(ids) {
  return questionsTable.getAll(...ids)
}

export function saveQuestions(questions, options) {
  return Promise.all(questions.map(question =>
    replaceInTable(question, questionsTable, options)
  ))
}

export function saveQuestion(question, options) {
  return replaceInTable(question, questionsTable, options)
}

export async function getRelativeContributionQuestionForSurvey(survey) {
  const rcQuestions = await r.expr(survey)('questionRefs')('questionId')
    .do(questionIds => questionsTable.getAll(r.args(questionIds)))
    .filter({responseType: 'relativeContribution', active: true})

  if (!rcQuestions.length) {
    throw new Error(`No Relative Contribution Question Found on this survey [${survey.id}]!`)
  }

  if (rcQuestions.length > 1) {
    throw new Error(`Multiple Relative Contribution Questions Found on this survey [${survey.id}]!`)
  }
  return rcQuestions[0]
}
