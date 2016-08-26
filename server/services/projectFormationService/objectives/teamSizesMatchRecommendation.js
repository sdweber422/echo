import {getTeamSizeForGoal} from '../pool'

export default function teamSizesMatchRecommendation(pool, teams, {teamsAreIncomplete} = {}) {
  const teamsWithPerfectSizes = teams.filter(team => {
    const expectedSize = getTeamSizeForGoal(pool, team.goalDescriptor)
    return teamsAreIncomplete ?
      team.playerIds.length <= expectedSize :
      team.playerIds.length === expectedSize
  })

  return teamsWithPerfectSizes.length / teams.length
}
