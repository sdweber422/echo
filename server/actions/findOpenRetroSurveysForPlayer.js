import Promise from 'bluebird'

import {connect} from 'src/db'
import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Player, Project} from 'src/server/services/dataService'
import {CYCLE_REFLECTION_STATES} from 'src/common/models/cycle'
import {PROJECT_STATES} from 'src/common/models/project'

const r = connect()

export default async function findOpenRetroSurveysForPlayer(playerIdentifier) {
  if (!playerIdentifier) {
    throw new Error(`Invalid player identifier: ${playerIdentifier}`)
  }

  let player
  try {
    player = typeof playerIdentifier === 'string' ?
      await Player.get(playerIdentifier) : playerIdentifier
  } catch (err) {
    player = null // ignore thinky error if not found
  }

  if (!player || !player.id) {
    throw new Error(`Player not found for identifier: ${playerIdentifier}`)
  }

  const openProjects = await Project.filter(_filterOpenProjectsForPlayer(player.id))

  return Promise.map(openProjects, project => (
    compileSurveyDataForPlayer(player.id, project.id)
  ))
}

function _filterOpenProjectsForPlayer(playerId) {
  return function (project) {
    const containsPlayer = project => project('playerIds').contains(playerId)
    const hasRetroSurvey = project => project('retrospectiveSurveyId')
    const isProjectInReview = project => project('state').eq(PROJECT_STATES.REVIEW)
    const isInOpenCycle = project =>
      r.expr(CYCLE_REFLECTION_STATES).contains(
        r.table('cycles').get(
          project('cycleId').default('')
        ).default({})('state')
      )
    const isRetroOpenForPlayer = project =>
      r.table('surveys')
        .get(project('retrospectiveSurveyId'))
        .do(survey =>
          r.or(
            survey('unlockedFor').default([]).contains(playerId),
            survey('completedBy').default([]).contains(playerId).not()
          )
        )
    return r.and(
      containsPlayer(project),
      hasRetroSurvey(project),
      isProjectInReview(project),
      isInOpenCycle(project),
      isRetroOpenForPlayer(project)
    )
  }
}
