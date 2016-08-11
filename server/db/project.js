import r from '../../db/connect'
import {REFLECTION} from '../../common/models/cycle'
import {customQueryError} from './errors'
import {checkForWriteErrors, isRethinkDBTerm, insertAllIntoTable, updateInTable} from './util'
import {cyclesTable} from './cycle'
import {getProjectReviewSurvey, getSurveyById} from './survey'
import {getSurveyResponsesForPlayer} from './response'

export const table = r.table('projects')

export function getProjectById(id) {
  return table.get(id)
}

export function getProjectByName(name) {
  return table.getAll(name, {index: 'name'})
    .nth(0)
    .default(customQueryError('No project found with that name'))
}

export function getProjectsForChapterInCycle(chapterId, cycleId) {
  return getProjectsForChapter(chapterId)
    .filter(row => row('cycleHistory')('cycleId').contains(cycleId))
}

export function getProjectsForChapter(chapterId) {
  return table.getAll(chapterId, {index: 'chapterId'})
}

export function getProjectsForPlayer(playerId) {
  return findProjects(project => (
    project('cycleHistory')
      .concatMap(ch => ch('playerIds'))
      .contains(playerId)
  ))
}

export function findProjects(filter) {
  const projects = table
  return filter ? projects.filter(filter) : projects
}

export function insertProjects(projects) {
  return insertAllIntoTable(projects, r.table('projects'))
}

export function findProjectBySurveyId(surveyId) {
  const findProjQuery = surveyFilter => findProjects(
    project => project('cycleHistory').filter(surveyFilter).count().gt(0)
  )
  const retroQuery = findProjQuery({retrospectiveSurveyId: surveyId})
  const projReviewQuery = findProjQuery({projectReviewSurveyId: surveyId})

  return r.branch(
    retroQuery.count().eq(1),
    retroQuery.nth(0),
    projReviewQuery.count().eq(1),
    projReviewQuery.nth(0),
    customQueryError('Unable to find a project for that survey')
  )
}

export function findProjectByPlayerIdAndCycleId(playerId, cycleId) {
  const projectsQuery = findProjects(
    project => getTeamPlayerIds(project, cycleId).contains(playerId)
  )

  return r.branch(
    projectsQuery.count().eq(1),
    projectsQuery.nth(0),
    projectsQuery.count().gt(1),
    customQueryError('This player is in multiple projects this cycle'),
    customQueryError('This player is not in any projects this cycle'),
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
  return updateInTable(project, table, options)
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
  }, options).then(checkForWriteErrors)
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

export function findProjectsAndReviewResponsesForPlayer(chapterId, cycleId, playerId) {
  return getProjectsForChapterInCycle(chapterId, cycleId)
    .merge(proj => ({
      projectReviewResponses: getProjectReviewSurvey(proj('id'), cycleId)
        .do(survey => survey('questionRefs')
          .map(ref => ({
            name: ref('name'),
            value: getSurveyResponsesForPlayer(playerId, survey('id'), ref('questionId'))
              .nth(0).default(r.object('value', null))('value'),
          }))
        )
    }))
    .orderBy('name')
}

export function getLatestCycleId(project) {
  if (isRethinkDBTerm(project)) {
    return getCycleIds(project).do(
      ids => ids.nth(ids.count().sub(1))
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
