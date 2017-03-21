import Promise from 'bluebird'

import {connect} from 'src/db'
import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Player, Project} from 'src/server/services/dataService'
import {LGBadInputError} from 'src/server/util/error'

const r = connect()

export default async function findOpenRetroSurveysForPlayer(playerIdentifier) {
  if (!playerIdentifier) {
    throw new LGBadInputError(`Invalid player identifier: ${playerIdentifier}`)
  }

  let player
  try {
    player = typeof playerIdentifier === 'string' ?
      await Player.get(playerIdentifier) : playerIdentifier
  } catch (err) {
    player = null // ignore thinky error if not found
  }

  if (!player || !player.id) {
    throw new LGBadInputError(`Player not found for identifier: ${playerIdentifier}`)
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
      isRetroOpenForPlayer(project)
    )
  }
}
