import {assertValidSurvey} from './survey'

export function entireProjectTeamHasCompletedSurvey(project, survey) {
  assertValidSurvey(survey)

  if (project.playerIds.length !== survey.completedBy.length) {
    return false
  }

  const sortedPlayers = project.playerIds.sort()
  const sortedPlayersWhoCompleted = survey.completedBy.sort()
  return sortedPlayersWhoCompleted.reduce((result, playerId, i) => {
    return result && playerId === sortedPlayers[i]
  }, true)
}
