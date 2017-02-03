import {getTeamSizeForGoal} from '../pool'

export default class TeamSizeOneGoalAppraiser {
  constructor(pool) {
    this.pool = pool
  }

  score(teamFormationPlan /* , {teamsAreIncomplete} = {} */) {
    // const {teams} = teamFormationPlan
    //
    // const teamsWithPerfectSizes = teams.filter(team => {
    //   const expectedSize = getTeamSizeForGoal(this.pool, team.goalDescriptor)
    //   console.log('expectedSize', expectedSize)
    //   console.log('team', team, '&&', team.teamSize)
    //   return team.teamSize === expectedSize
    // })
    //
    // return teamsWithPerfectSizes.length / teams.length

    return 'bob'
  }
}
