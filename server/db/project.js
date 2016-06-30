import r from '../../db/connect'
import {REFLECTION} from '../../common/models/cycle'
import {customQueryError} from './errors'
import {checkForErrors, isRethinkDBTerm, updateInTable} from './util'
import {cyclesTable} from './cycle'
import {getSurveyById} from './survey'

export const projectsTable = r.table('projects')

export function getProjectById(id) {
  return projectsTable.get(id)
}

export function getProjectByName(name) {
  return projectsTable.getAll(name, {index: 'name'})
    .nth(0)
    .default(r.error('No project found with that name'))
}

export function getProjectsForChapter(chapterId) {
  return projectsTable.getAll(chapterId, {index: 'chapterId'})
}

export function findProjects(filter) {
  return projectsTable.filter(filter)
}

export function findProjectByRetrospectiveSurveyId(retrospectiveSurveyId) {
  return findProjects(
    project => project('cycleHistory').filter({retrospectiveSurveyId}).count().gt(0)
  ).nth(0)
  .default(
    customQueryError('Unable to find a project for this retrospective survey')
  )
}

export function findProjectByPlayerIdAndCycleId(playerId, cycleId) {
  return findProjects(
    project => getTeamPlayerIds(project, cycleId).contains(playerId)
  ).nth(0)
  .default(
    customQueryError('This player is not in any projects this cycle')
  )
}

export function findProjectByNameForPlayer(name, playerId) {
  return findProjects(
    project => r.and(
      project('name').eq(name),
      project('cycleHistory').concatMap(ch => ch('playerIds')).contains(playerId)
    )
  )
    .nth(0)
    .default(customQueryError('No such project exist with that name for that player'))
}

export function update(project, options) {
  return updateInTable(project, projectsTable, options)
}

export function setRetrospectiveSurveyForCycle(projectId, cycleId, retrospectiveSurveyId, options = {}) {
  return updateProjectHistoryForCycle(projectId, cycleId, {retrospectiveSurveyId}, options)
}

export function setProjectReviewSurveyForCycle(projectId, cycleId, projectReviewSurveyId, options = {}) {
  return updateProjectHistoryForCycle(projectId, cycleId, {projectReviewSurveyId}, options)
}

function updateProjectHistoryForCycle(projectId, cycleId, historyMerge, options = {}) {
  const cycleHistory = r.row('cycleHistory').default([])

  const historyItemOffset = cycleHistory
    .offsetsOf(item => item('cycleId').eq(cycleId))
    .nth(0)
    .default(customQueryError('Project has no history for that cycle'))

  const updatedHistoryItem = cycleHistory.nth(historyItemOffset).merge(historyMerge)

  return getProjectById(projectId).update({
    cycleHistory: cycleHistory.changeAt(historyItemOffset, updatedHistoryItem)
  }, options).then(checkForErrors)
}

export function getProjectHistoryForCycle(project, cycleId) {
  if (isRethinkDBTerm(project)) {
    return project('cycleHistory').filter({cycleId}).nth(0)
  }
  return project.cycleHistory.find(c => c.cycleId === cycleId)
}

export async function findActiveProjectReviewSurvey(project) {
  const cycleIdsInReflection = await cyclesTable.getAll(r.args(getCycleIds(project))).filter({state: REFLECTION})('id')

  if (cycleIdsInReflection.length === 0) {
    return
  }

  if (cycleIdsInReflection.length > 1) {
    throw new Error('This project [${project.name}] is in more than one cycle in the REFLECTION state')
  }

  const surveyId = project.cycleHistory
    .find(({cycleId}) => cycleId === cycleIdsInReflection[0])
    .projectReviewSurveyId

  if (!surveyId) {
    return
  }

  return await getSurveyById(surveyId)
}

export function getLatestCycleId(project) {
  if (isRethinkDBTerm(project)) {
    return getCycleIds(project).do(
      ids => ids.nth(ids.count().subtract(1))
    )
  }
  const cycleIds = getCycleIds(project)
  return cycleIds[cycleIds.length - 1]
}

export function getCycleIds(project) {
  if (isRethinkDBTerm(project)) {
    return project('cycleHistory').map(h => h('cycleId'))
  }
  return project.cycleHistory.map(h => h.cycleId)
}

export function getTeamPlayerIds(project, cycleId) {
  if (isRethinkDBTerm(project)) {
    return project('cycleHistory').filter({cycleId}).nth(0)('playerIds')
  }
  return project.cycleHistory.find(c => c.cycleId === cycleId).playerIds
}
