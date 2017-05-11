import Promise from 'bluebird'

import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Player, Project, filterOpenProjectsForPlayer} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function findOpenRetroSurveysForPlayer(playerIdentifier) {
  if (!playerIdentifier) {
    throw new LGBadRequestError(`Invalid player identifier: ${playerIdentifier}`)
  }

  let player
  try {
    player = typeof playerIdentifier === 'string' ?
      await Player.get(playerIdentifier) : playerIdentifier
  } catch (err) {
    player = null // ignore thinky error if not found
  }

  if (!player || !player.id) {
    throw new LGBadRequestError(`Player not found for identifier: ${playerIdentifier}`)
  }

  const openProjects = await Project.filter(filterOpenProjectsForPlayer(player.id))

  return Promise.map(openProjects, project => (
    compileSurveyDataForPlayer(player.id, project.id)
  ))
}
