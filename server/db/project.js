import r from '../../db/connect'

export function getProjectsForChapter(chapterId) {
  return r.table('projects').getAll(chapterId, {index: 'chapterId'})
}

export function findProjects(filter) {
  return r.table('projects').filter(filter)
}

export function findProjectByPlayerIdAndCycleId(playerId, cycleId) {
  return findProjects(
    project => project('cycleTeams')(cycleId)('playerIds').contains(playerId)
  ).nth(0)
}
