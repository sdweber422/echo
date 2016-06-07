import r from '../../db/connect'

import {RETROSPECTIVE} from '../../common/models/cycle'
import {findCycles} from '../../server/db/cycle'
import {getPlayerById} from '../../server/db/player'
import {findProjectByPlayerIdAndCycleId} from '../../server/db/project'

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey.id, survey)
  }
  return insert(survey)
}

export function getCurrentRetrospectiveSurveyForPlayer(playerId) {
  return getCurrentCycleIdAndProjectIdForPlayer(playerId).do(
    ids => getProjectRetroSurvey(ids('projectId'), ids('cycleId'))
  )
}

function getCurrentCycleIdAndProjectIdForPlayer(playerId) {
  const cycle = findCycles({
    state: RETROSPECTIVE,
    chapterId: getPlayerById(playerId)('chapterId'),
  }).nth(0)

  return cycle.do(
    cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id'))
      .pluck('id')
      .merge(project => project.merge({projectId: project('id'), cycleId: cycle('id')}))
      .without('id')
  )
}

export function getCurrentRetrospectiveSurveyForPlayerDeeply(playerId) {
  return r.do(
    getCurrentRetrospectiveSurveyForPlayer(playerId),
    inflateSurveyItems
  ).merge(survey => ({
    project: {id: survey('projectId')},
    cycle: {id: survey('cycleId')},
  }))
}

function inflateSurveyItems(surveyQuery) {
  const mapSurveyItemsToQuestions = surveyItems => {
    return surveyItems.map(item =>
      r.table('questions')
       .get(item('questionId'))
       .merge(() => ({
         subject: item('subject')
       }))
    )
  }

  return surveyQuery.merge(survey => ({
    questions: mapSurveyItemsToQuestions(survey('questions'))
  }))
}

export function getProjectRetroSurvey(projectId, cycleId) {
  return r.table('surveys').getAll([cycleId, projectId], {index: 'cycleIdAndProjectId'}).nth(0)
}

function update(id, survey) {
  const surveyWithTimestamps = Object.assign({}, survey, {
    updatedAt: r.now(),
  })
  return r.table('surveys').get(id).update(surveyWithTimestamps)
}

function insert(survey) {
  const surveyWithTimestamps = Object.assign({}, survey, {
    updatedAt: r.now(),
    createdAt: r.now(),
  })
  return r.table('surveys').insert(surveyWithTimestamps)
}
