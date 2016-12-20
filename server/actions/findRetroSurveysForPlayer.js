import Promise from 'bluebird'

import {connect} from 'src/db'
import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Player, Project} from 'src/server/services/dataService'
import {REFLECTION, COMPLETE} from 'src/common/models/cycle'

const ACTIVE_CYCLE_RETRO_STATES = [REFLECTION, COMPLETE]

const r = connect()

export default async function findRetroSurveysForPlayer(playerIdentifier) {
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
    const isInOpenCycle = project =>
      r.expr(ACTIVE_CYCLE_RETRO_STATES).contains(
        r.table('cycles').get(
          project('cycleId').default('')
        ).default({})('state')
      )
    const hasNotBeenCompletedByAllPlayers = project =>
      r.table('surveys')
        .get(project('retrospectiveSurveyId'))('completedBy').count()
        .lt(project('playerIds').count())
    return r.and(
      containsPlayer(project),
      hasRetroSurvey(project),
      isInOpenCycle(project),
      hasNotBeenCompletedByAllPlayers(project)
    )
  }
}
