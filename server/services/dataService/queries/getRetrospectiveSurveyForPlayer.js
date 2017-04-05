import {REFLECTION} from 'src/common/models/cycle'
import {RETROSPECTIVE_DESCRIPTOR} from 'src/common/models/surveyBlueprint'

import r from '../r'
import {customQueryError} from '../util'
import excludeQuestionsAboutRespondent from './excludeQuestionsAboutRespondent'
import getSurveyById from './getSurveyById'

const projectsTable = r.table('projects')

export default function getRetrospectiveSurveyForPlayer(playerId, projectId) {
  let survey
  if (!projectId) {
    survey = _getCurrentProjectInCycleStateForPlayer(playerId, REFLECTION).do(
      project => _getProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR).merge({projectId: project('id')})
    )
  } else {
    survey = projectsTable.get(projectId).do(project => {
      return r.branch(
        project('playerIds').contains(playerId),
        _getProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR).merge({projectId: project('id')}),
        customQueryError('Player not on the team for that project this cycle'),
      )
    })
  }
  return excludeQuestionsAboutRespondent(survey, playerId)
}

function _getCurrentProjectInCycleStateForPlayer(playerId, cycleState) {
  return r.table('cycles').filter({
    state: cycleState,
    chapterId: r.table('players').get(playerId)('chapterId'),
  })
  .nth(0)
  .default(customQueryError(`There is no project for a cycle in the ${cycleState} state for this player's chapter`))
  .do(cycle => _findProjectByPlayerIdAndCycleId(playerId, cycle('id')))
}

function _getProjectSurvey(project, surveyDescriptor) {
  return project
    .do(project => getSurveyById(project(`${surveyDescriptor}SurveyId`)))
    .default(
      customQueryError(`There is no ${surveyDescriptor} survey for this project and cycle`)
    )
}

function _findProjectByPlayerIdAndCycleId(playerId, cycleId) {
  const projectFilter = project => r.and(
    project('cycleId').eq(cycleId),
    project('playerIds').contains(playerId)
  )

  const projectsQuery = r.table('projects').filter(projectFilter)

  return r.branch(
   projectsQuery.count().eq(1),
   projectsQuery.nth(0),
   projectsQuery.count().gt(1),
   customQueryError('This player is in multiple projects this cycle'),
   customQueryError('This player is not in any projects this cycle'),
 )
}
