import {getTeamSizeForGoal} from '../pool'

export default function teamSizesMatchRecommendation(pool, teamFormationPlan /* , {teamsAreIncomplete} = {} */) {
  const {teams} = teamFormationPlan

  const teamsWithPerfectSizes = teams.filter(team => {
    const expectedSize = getTeamSizeForGoal(pool, team.goalDescriptor)
    return team.teamSize === expectedSize
  })

  return teamsWithPerfectSizes.length / teams.length
}
