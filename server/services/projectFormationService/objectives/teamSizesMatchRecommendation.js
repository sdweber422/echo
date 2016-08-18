import {getTeamSizeForGoal} from '../pool'

export default function teamSizesMatchRecommendation(pool, teams) {
  const teamsWithPerfectSizes = teams.filter(team =>
    teamSizeMatchesRecommendation(pool, team)
  )

  return teamsWithPerfectSizes.length / teams.length
}

function teamSizeMatchesRecommendation(pool, team) {
  const expectedSize = getTeamSizeForGoal(pool, team.goalDescriptor)
  return team.playerIds.length === expectedSize
}
