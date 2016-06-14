import r from '../../db/connect'

import {RETROSPECTIVE} from '../../common/models/cycle'
import {findCycles} from '../../server/db/cycle'
import {getPlayerById} from '../../server/db/player'
import {getQuestionById} from '../../server/db/question'
import {findProjectByPlayerIdAndCycleId} from '../../server/db/project'
import {customQueryError} from '../../server/db/errors'

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
    state: RETROSPECTIVE,
    chapterId: getPlayerById(playerId)('chapterId'),
  }).nth(0).default(customQueryError('There is no cycle in the retrospective state for this chapter'))

  return cycle.do(
    cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id'))
      .pluck('id')
      .merge(project => ({projectId: project('id'), cycleId: cycle('id')}))
      .without('id')
  )
}

export function getFullRetrospectiveSurveyForPlayer(playerId) {
  return r.do(
    getRetrospectiveSurveyForPlayer(playerId),
    inflateQuestionRefs
  ).merge(survey => ({
    project: {id: survey('projectId')},
    cycle: {id: survey('cycleId')},
  }))
}

function inflateQuestionRefs(surveyQuery) {
  return surveyQuery.merge(survey => ({
    questions: mapRefsToQuestions(survey('questionRefs'))
  }))
}

function getResponseIntructionsByType(type) {
  const intructionsByType = {
    relativeContribution:
`Use the command:
\`/log -r -q<questionNumber> <teammate>:<%contribution> [<teammate>:<%contribution>...]\`

For example:
\`/log -r -q1 beth:30 amy:20 jose:25 tim:15\``,

    text:
`Use the command:
\`/log -r -q<questionNumber> "your response"\``
  }
  return r.expr(intructionsByType)(type)
}

function mapRefsToQuestions(questionRefs) {
  return questionRefs.map(ref =>
    getQuestionById(ref('questionId'))
      .merge(question => ({
        subject: ref('subject'),
        responseIntructions: getResponseIntructionsByType(question('responseType'))
      }))
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
