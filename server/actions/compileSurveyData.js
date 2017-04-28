import {renderQuestionBodies} from 'src/common/models/survey'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {Project, getFullRetrospectiveSurveyForPlayer} from 'src/server/services/dataService'
import {customQueryError} from 'src/server/services/dataService/util'
import {LGForbiddenError} from 'src/server/util/error'

export async function compileSurveyDataForPlayer(playerId, projectId) {
  const survey = await getFullRetrospectiveSurveyForPlayer(playerId, projectId)
    .then(survey => inflateSurveySubjects(survey))
    .then(survey => Object.assign({}, survey, {
      questions: renderQuestionBodies(survey.questions)
    }))
  const surveyCompletedBy = survey.completedBy || []
  const surveyUnlockedFor = survey.unlockedFor || []
  if (surveyCompletedBy.includes(playerId) && !surveyUnlockedFor.includes(playerId)) {
    throw new LGForbiddenError('This survey has been completed and is locked.')
  }
  return survey
}

export function compileSurveyQuestionDataForPlayer(playerId, questionNumber, projectId) {
  return getFullRetrospectiveSurveyForPlayer(playerId, projectId)('questions')
    .nth(questionNumber - 1)
    .default(customQueryError(`There is no question number ${questionNumber}`))
    .then(question => inflateSurveyQuestionSubjects([question]))
    .then(questions => renderQuestionBodies(questions))
    .then(questions => questions[0])
}

function inflateSurveySubjects(survey) {
  return inflateSurveyQuestionSubjects(survey.questions)
    .then(questions => Object.assign({}, survey, {questions}))
}

async function inflateSurveyQuestionSubjects(questions) {
  const subjectIds = getSubjects(questions)
  const playerInfo = await getPlayerInfoByIds(subjectIds)
  const projectInfo = await getProjectInfoByIds(subjectIds)
  const subjectInfo = {...playerInfo, ...projectInfo}

  const inflatedQuestions = questions.map(question => {
    const inflatedSubject = question.subjectIds.map(subjectId => subjectInfo[subjectId])
    return Object.assign({}, question, {subjects: inflatedSubject})
  })

  return inflatedQuestions
}

function getSubjects(questions) {
  return questions
    .reduce((prev, question) => prev.concat(question.subjectIds), [])
}

async function getProjectInfoByIds(projectIds = []) {
  const projects = await Project.getAll(...projectIds)
  return projects.reduce((result, next) => ({...result, [next.id]: {id: next.id, handle: next.name, name: next.name}}), {})
}

async function getPlayerInfoByIds(playerIds) {
  const players = await getPlayerInfo(playerIds)
  return players.reduce((result, player) => {
    result[player.id] = player
    return result
  }, {})
}
