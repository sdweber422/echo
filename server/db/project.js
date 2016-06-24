import r from '../../db/connect'
import {customQueryError} from '../../server/db/errors'
import {getLatestCycleForChapter} from './cycle'
import {getPlayerById} from './player'
import {isRethinkDBQuery, updateInTable} from '../../server/db/util'

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

export function getCycleIds(project) {
  if (isRethinkDBQuery(project)) {
    // return project.cycleInfo.filter({cycleId}).nth(0)('playerIds')
    return project('cycleTeams').keys()
  }
  // return project.cycleInfo.find(c => c.cycleId === cycleId).playerIds
  return Object.keys(project.cycleTeams)
}

export function getTeamPlayerIds(project, cycleId) {
  if (isRethinkDBQuery(project)) {
    // return project.cycleInfo.filter({cycleId}).nth(0)('playerIds')
    return project('cycleTeams')(cycleId)('playerIds')
  }
  // return project.cycleInfo.find(c => c.cycleId === cycleId).playerIds
  return project.cycleTeams[cycleId].playerIds
}
