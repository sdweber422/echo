import {assertValidSurvey} from './survey'

export function entireProjectTeamHasCompletedSurvey(project, survey) {
  assertValidProject(project)
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

export function assertValidProject(project) {
  const {id, name, playerIds, retrospectiveSurveyId} = project
  if (!playerIds || playerIds.length === 0) {
    throw new Error(`No players found on team for project ${name} (${id})`)
  }
  if (!retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${name} (${id})`)
  }
}
