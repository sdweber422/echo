import {connect} from 'src/db'
import {Player, Project} from 'src/server/services/dataService'
import {REFLECTION, COMPLETE} from 'src/common/models/cycle'

const ACTIVE_CYCLE_STATES = [REFLECTION, COMPLETE]

const r = connect()

export default async function findActiveProjectsForPlayer(playerIdentifier) {
  if (!playerIdentifier) {
    throw new Error(`Invalid layer identifier: ${playerIdentifier}`)
  }

  const player = typeof playerIdentifier === 'string' ?
    await Player.get(playerIdentifier) : playerIdentifier

  if (!player || !player.id) {
    throw new Error(`Player not found for identifier: ${playerIdentifier}`)
  }

  // project is "active" if in a cycle in REFLECTION or COMPLETE state
  // and for which the retro survey has not been completed by all members
  return Project.filter(project => r.and(
    project('playerIds').contains(player.id),

    r.expr(ACTIVE_CYCLE_STATES).contains(
      r.table('cycles').get(
        project('cycleId').default('')
      ).default({})('state')
    ),

    r.or(
      project('retrospectiveSurveyId')
        .default(null)
        .eq(null),

      r.table('surveys')
        .get(project('retrospectiveSurveyId'))
        .default({})('completedBy')
        .default([]).count()
        .lt(project('playerIds').default([]).count())
    )
  ))
}
