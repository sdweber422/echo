import r from '../../db/connect'
import {customQueryError} from '../../server/db/errors'
import {updateInTable} from '../../server/db/util'

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
    project => project('cycleTeams')(cycleId)('playerIds').contains(playerId)
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
