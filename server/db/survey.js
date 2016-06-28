import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import r from '../../db/connect'

import {REFLECTION} from '../../common/models/cycle'
import {SURVEY_BLUEPRINT_DESCRIPTORS} from '../../common/models/surveyBlueprint'
import {findCycles} from '../../server/db/cycle'
import {updateInTable, insertIntoTable} from '../../server/db/util'
import {getPlayerById} from './player'
import {getQuestionById} from './question'
import {getProjectById, getProjectHistoryForCycle, findProjectByPlayerIdAndCycleId} from './project'
import {responsesTable, getSurveyResponsesForPlayer} from './response'
import {customQueryError} from './errors'

export const surveysTable = r.table('surveys')

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey)
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
  const surveyQuery = getRetrospectiveSurveyForPlayer(playerId)
  return inflateQuestionRefs(playerId, surveyQuery)
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
    responseQuery.filter({subject: questionRef('subject')}).nth(0).default(null),
    hasMultipartResponse,
    responseQuery
      .orderBy(subjectPosition)
      .coerceTo('array'),
    null
  )
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
  return getProjectSurvey(projectId, cycleId, SURVEY_BLUEPRINT_DESCRIPTORS.projectReview)
}

export function getProjectRetroSurvey(projectId, cycleId) {
  return getProjectSurvey(projectId, cycleId, SURVEY_BLUEPRINT_DESCRIPTORS.retrospective)
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

export function getSurveyStats(surveyId) {
  const query = getSurveyById(surveyId)
  return mergeSurveyStats(query)
}

export function mergeSurveyStats(queryWithQuestionRefsAndSurveyId) {
  let query = mergeSubjectCount(queryWithQuestionRefsAndSurveyId)
  query = mergeProgress(query)
  return query
}

export function surveyWasCompletedBy(surveyId, respondentId) {
  return getSurveyById(surveyId)
    .do(mergeSurveyStats)
    .then(result => {
      const respondentProgress = result.progress.find(progressItem => respondentId === progressItem.respondentId)
      return respondentProgress && respondentProgress.completed
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

function mergeProgress(queryWithSurveyId) {
  const surveyId = row => row('surveyId').default(row('id'))

  return queryWithSurveyId.merge(row => ({
    progress: responsesTable
      // 1. Get all the responses for this survey
      .filter({surveyId: surveyId(row)})
      // 2. Get a count of responses by respondentId like:
      // [
      //   {group: $id1, reduction: 5},
      //   {group: $id2, reduction: 2},
      //   ...
      // ]
      .group('respondentId').count().ungroup()
      // 3. Rename 'group' and 'reduction' and add a 'completed' field
      //    that's true if there's a response for every subject.
      .map(group => ({
        respondentId: group('group'),
        responseCount: group('reduction'),
        completed: group('reduction').eq(row('subjectCount')),
      }))
  }))
}

function mergeSubjectCount(queryWithQuestionRefs) {
  return queryWithQuestionRefs.merge(row => ({
    subjectCount: row('questionRefs').map(
      ref => r.branch(
        ref('subject').typeOf().eq('STRING'),
        1,
        ref('subject').count()
      )
    )
  }))
  .merge(row => ({
    subjectCount: row('subjectCount').sum()
  }))
}

