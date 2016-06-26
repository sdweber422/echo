import r from '../../db/connect'
import {customQueryError} from './errors'
import {checkForErrors, updateInTable} from './util'
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
  const history = r.row('history').default([])

  const historyItemOffset = history
    .offsetsOf(item => item('cycleId').eq(cycleId))
    .nth(0)
    .default(customQueryError(`Project [${projectId}] has no history for that cycle [${cycleId}]`))

  const updatedHistoryItem = history.nth(historyItemOffset).merge({retrospectiveSurveyId})

  return getProjectById(projectId).update({
    history: history.changeAt(historyItemOffset, updatedHistoryItem)
  }, options).then(checkForErrors)
}

export function getCycleIds(project) {
  if (typeof project === 'object') {
    return project.history.map(h => h.cycleId)
  }
  return project('history').map(h => h('cycleId'))
}

export function getTeamPlayerIds(project, cycleId) {
  if (typeof project === 'object') {
    return project.history.find(c => c.cycleId === cycleId).playerIds
  }
  return project('history').filter({cycleId}).nth(0)('playerIds')
}

export function getRetrospectiveSurveyIdForCycle(project, cycleId) {
  if (typeof project === 'object') {
    return project.history.find(c => c.cycleId === cycleId).retrospectiveSurveyId
  }
  return project('history').filter({cycleId}).nth(0)('retrospectiveSurveyId')
}
