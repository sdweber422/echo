import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import r from '../../db/connect'

import {REFLECTION} from '../../common/models/cycle'
import {findCycles} from '../../server/db/cycle'
import {getPlayerById} from './player'
import {getQuestionById} from './question'
import {findProjectByPlayerIdAndCycleId} from './project'
import {getSurveyResponsesForPlayer} from './response'
import {customQueryError} from './errors'

export const surveysTable = r.table('surveys')

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey.id, survey)
  }
  return insert(survey)
}

export function getRetrospectiveSurveyForPlayer(playerId) {
  return getCurrentCycleIdAndProjectIdForPlayer(playerId).do(
    ids => getProjectRetroSurvey(ids('projectId'), ids('cycleId'))
  )
}

function getCurrentCycleIdAndProjectIdForPlayer(playerId) {
  const cycle = findCycles({
    state: REFLECTION,
    chapterId: getPlayerById(playerId)('chapterId'),
  }).nth(0).default(customQueryError('There is no cycle in the reflection state for this chapter'))

  return cycle.do(
    cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id'))
      .pluck('id')
      .merge(project => ({projectId: project('id'), cycleId: cycle('id')}))
      .without('id')
  )
}

export function getFullRetrospectiveSurveyForPlayer(playerId) {
  return r.do(
    playerId,
    getRetrospectiveSurveyForPlayer(playerId),
    inflateQuestionRefs
  ).merge(survey => ({
    project: {id: survey('projectId')},
    cycle: {id: survey('cycleId')},
  }))
}

function inflateQuestionRefs(playerId, surveyQuery) {
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
        subject: ref('subject'),
        responseIntructions: getResponseInstructionsByType(question('responseType')),
        response: getResponse(playerId, survey('id'), ref),
      }))
  )
}

function getResponse(playerId, surveyId, questionRef) {
  const responseQuery = getSurveyResponsesForPlayer(
    playerId,
    surveyId,
    questionRef('questionId')
  )
  const subjectPosition = response => questionRef('subject').offsetsOf(response('subject'))
  const hasSinglePartSubject = questionRef('subject').typeOf().eq('STRING')
  const hasMultipartResponse = responseQuery.nth(0).default(false)

  return r.branch(
    hasSinglePartSubject,
    responseQuery.nth(0).default(null),
    hasMultipartResponse,
    responseQuery
      .orderBy(subjectPosition)
      .coerceTo('array'),
    null
  )
}

export function getProjectRetroSurvey(projectId, cycleId) {
  return surveysTable.getAll([cycleId, projectId], {index: 'cycleIdAndProjectId'})
    .nth(0)
    .default(
      customQueryError('There is no retrospective survey for this project and cycle')
    )
}

function update(id, survey) {
  const surveyWithTimestamps = Object.assign({}, survey, {
    updatedAt: r.now(),
  })
  return surveysTable.get(id).update(surveyWithTimestamps)
}

function insert(survey) {
  const surveyWithTimestamps = Object.assign({}, survey, {
    updatedAt: r.now(),
    createdAt: r.now(),
  })
  return surveysTable.insert(surveyWithTimestamps)
}
