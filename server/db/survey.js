import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import r from 'src/db/connect'

import {REFLECTION} from 'src/common/models/cycle'
import {surveyProgress} from 'src/common/models/survey'
import {RETROSPECTIVE_DESCRIPTOR, PROJECT_REVIEW_DESCRIPTOR} from 'src/common/models/surveyBlueprint'
import {findCycles} from 'src/server/db/cycle'
import {updateInTable, insertIntoTable} from 'src/server/db/util'

import {customQueryError} from './errors'
import {getPlayerById} from './player'
import {getQuestionById} from './question'
import {getSurveyResponsesForPlayer} from './response'
import {
  getProjectById,
  getProjectHistoryForCycle,
  findProjectByPlayerIdAndCycleId,
  getLatestCycleId,
  getTeamPlayerIds,
} from './project'

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
    survey = getCurrentCycleIdAndProjectIdInStateForPlayer(playerId, REFLECTION).do(
      ids => getProjectRetroSurvey(ids('projectId'), ids('cycleId'))
        .merge({cycleId: ids('cycleId'), projectId: ids('projectId')})
    )
  } else {
    survey = getProjectById(projectId).do(project => {
      const cycleId = getLatestCycleId(project)
      return r.branch(
        getTeamPlayerIds(project, cycleId).contains(playerId),
        getProjectRetroSurvey(projectId, cycleId)
          .merge({cycleId, projectId}),
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

function getCurrentCycleIdAndProjectIdInStateForPlayer(playerId, state) {
  const cycle = findCycles({
    state,
    chapterId: getPlayerById(playerId)('chapterId'),
  }).nth(0).default(customQueryError(`There is no cycle in the ${state} state for this chapter`))

  return cycle.do(
    cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id'))
      .pluck('id')
      .merge(project => ({projectId: project('id'), cycleId: cycle('id')}))
      .without('id')
  )
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

export function getProjectSurvey(projectId, cycleId, surveyDescriptor) {
  return getProjectById(projectId)
    .do(project => getProjectHistoryForCycle(project, cycleId)(`${surveyDescriptor}SurveyId`))
    .do(getSurveyById)
    .default(
      customQueryError(`There is no ${surveyDescriptor} survey for this project and cycle`)
    )
}

export function getProjectReviewSurvey(projectId, cycleId) {
  return getProjectSurvey(projectId, cycleId, PROJECT_REVIEW_DESCRIPTOR)
}

export function getProjectRetroSurvey(projectId, cycleId) {
  return getProjectSurvey(projectId, cycleId, RETROSPECTIVE_DESCRIPTOR)
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

export function recordSurveyCompletedBy(surveyId, respondentId) {
  const currentCompletedBy = r.row('completedBy').default([])
  const newCompletedBy = currentCompletedBy.setInsert(respondentId)
  const newUpdatedAt = r.branch(
    newCompletedBy.eq(currentCompletedBy),
    r.row('updatedAt'),
    r.now()
  )
  return update({
    id: surveyId,
    completedBy: newCompletedBy,
    updatedAt: newUpdatedAt
  }, {returnChanges: true})
}
