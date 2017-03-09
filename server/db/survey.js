import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {connect} from 'src/db'

import {REFLECTION} from 'src/common/models/cycle'
import {surveyProgress} from 'src/common/models/survey'
import {RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {findCycles} from 'src/server/db/cycle'
import {updateInTable, insertIntoTable} from 'src/server/db/util'

import {customQueryError} from './errors'
import {getPlayerById} from './player'
import {getQuestionById} from './question'
import {getSurveyResponsesForPlayer} from './response'
import {getProjectById, findProjectByPlayerIdAndCycleId} from './project'

const r = connect()
export const surveysTable = r.table('surveys')

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey)
  }
  return insert(survey)
}

export function getRetrospectiveSurveyForPlayer(playerId, projectId) {
  let survey
  if (!projectId) {
    survey = getCurrentProjectInCycleStateForPlayer(playerId, REFLECTION).do(
      project => getProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR).merge({projectId: project('id')})
    )
  } else {
    survey = getProjectById(projectId).do(project => {
      return r.branch(
        project('playerIds').contains(playerId),
        getProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR).merge({projectId: project('id')}),
        customQueryError('Player not on the team for that project this cycle'),
      )
    })
  }
  return excludeQuestionsAboutRespondent(survey, playerId)
}

export function getSurveyForPlayerById(playerId, surveyId) {
  const survey = getSurveyById(surveyId)
  return excludeQuestionsAboutRespondent(survey, playerId)
}

function excludeQuestionsAboutRespondent(surveyQuery, respondentId) {
  const questionRefIsAboutRespondent = ref => r.and(
    ref('subjectIds').count().eq(1),
    ref('subjectIds').nth(0).eq(respondentId)
  )
  const filteredQuestionRefs = row => row('questionRefs').filter(
    ref => r.not(questionRefIsAboutRespondent(ref))
  )
  return surveyQuery.merge(row => ({
    questionRefs: filteredQuestionRefs(row)
  }))
}

function getCurrentProjectInCycleStateForPlayer(playerId, cycleState) {
  const cycle = findCycles({
    state: cycleState,
    chapterId: getPlayerById(playerId)('chapterId'),
  }).nth(0).default(customQueryError(`There is no project for a cycle in the ${cycleState} state for this player's chapter`))

  return cycle.do(cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id')))
}

export function getFullRetrospectiveSurveyForPlayer(playerId, projectId) {
  const surveyQuery = getRetrospectiveSurveyForPlayer(playerId, projectId)
  return inflateQuestionRefs(playerId, surveyQuery)
}

export function getFullSurveyForPlayerById(playerId, surveyId) {
  const surveyQuery = getSurveyForPlayerById(playerId, surveyId)
  return inflateQuestionRefs(playerId, surveyQuery)
}

export function inflateQuestionRefs(playerId, surveyQuery) {
  return surveyQuery.merge(survey => ({
    questions: mapRefsToQuestions(survey, playerId)
  }))
}

let SURVEY_RESPONSE_INSTRUCTIONS
function getResponseInstructionsByType(type) {
  if (!SURVEY_RESPONSE_INSTRUCTIONS) {
    const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', 'survey-response-instructions.yaml')
    const data = fs.readFileSync(dataFilename).toString()
    SURVEY_RESPONSE_INSTRUCTIONS = yaml.parse(data)
  }
  return r.expr(SURVEY_RESPONSE_INSTRUCTIONS)(type)
}

function mapRefsToQuestions(survey, playerId) {
  return survey('questionRefs').map(ref =>
    getQuestionById(ref('questionId'))
      .merge(question => ({
        subjectIds: ref('subjectIds'),
        name: ref('name').default(null),
        responseInstructions: getResponseInstructionsByType(question('responseType')),
        response: getResponse(playerId, survey('id'), ref),
      }))
  )
}

function getResponse(playerId, surveyId, questionRef) {
  const responseQuery = getSurveyResponsesForPlayer(
    playerId,
    surveyId,
    questionRef('questionId'),
    questionRef('subjectIds'),
  )
  const subjectPosition = response => questionRef('subjectIds').offsetsOf(response('subjectId'))
  const responseValueList = responseQuery
    .orderBy(subjectPosition)
    .map(response => ({
      subjectId: response('subjectId'),
      value: response('value'),
    }))
    .coerceTo('array')
  return {values: responseValueList}
}

export function getProjectSurvey(project, surveyDescriptor) {
  return project
    .do(project => getSurveyById(project(`${surveyDescriptor}SurveyId`)))
    .default(
      customQueryError(`There is no ${surveyDescriptor} survey for this project and cycle`)
    )
}

export function update(survey, options) {
  return updateInTable(survey, surveysTable, options)
}

function insert(survey, options) {
  return insertIntoTable(survey, surveysTable, options)
}

export function getSurveyById(id) {
  return surveysTable.get(id)
}

export function surveyWasCompletedBy(surveyId, respondentId) {
  return getFullSurveyForPlayerById(respondentId, surveyId)
    .then(fullSurvey => {
      const progress = surveyProgress(fullSurvey)
      return progress.completed
    })
}
