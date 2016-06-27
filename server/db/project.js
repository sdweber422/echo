import r from '../../db/connect'
import {customQueryError} from './errors'
import {checkForErrors, isRethinkDBTerm, updateInTable} from './util'
import {getLatestCycleForChapter} from './cycle'
import {getPlayerById} from './player'

export const projectsTable = r.table('projects')

export function getProjectById(id) {
  return projectsTable.get(id)
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
    customQueryError('Unable to find a project for this retrispective survey')
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

export function findCurrentProjectForPlayerId(playerId) {
  return r.do(
    getPlayerById(playerId),
    player => getLatestCycleForChapter(player('chapterId'))
  ).do(cycle => findProjectByPlayerIdAndCycleId(playerId, cycle('id')))
}

export function update(project, options) {
  return updateInTable(project, projectsTable, options)
}

export function setRetrospectiveSurveyForCycle(projectId, cycleId, retrospectiveSurveyId, options = {}) {
  const cycleHistory = r.row('cycleHistory').default([])

  const historyItemOffset = cycleHistory
    .offsetsOf(item => item('cycleId').eq(cycleId))
    .nth(0)
    .default(customQueryError('Project has no history for that cycle'))

  const updatedHistoryItem = cycleHistory.nth(historyItemOffset).merge({retrospectiveSurveyId})

  return getProjectById(projectId).update({
    cycleHistory: cycleHistory.changeAt(historyItemOffset, updatedHistoryItem)
  }, options).then(checkForErrors)
}

export function getRetrospectiveSurveyIdForCycle(project, cycleId) {
  if (isRethinkDBTerm(project)) {
    return project('cycleHistory').filter({cycleId}).nth(0)('retrospectiveSurveyId')
  }
  return project.cycleHistory.find(c => c.cycleId === cycleId).retrospectiveSurveyId
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
