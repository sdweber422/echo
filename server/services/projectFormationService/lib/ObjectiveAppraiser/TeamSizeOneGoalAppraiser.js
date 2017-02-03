import {getTeamSizeForGoal} from '../pool'

export default class TeamSizeOneGoalAppraiser {
  constructor(pool) {
    this.pool = pool
  }

  score(teamFormationPlan /* , {teamsAreIncomplete} = {} */) {
    const {teams} = teamFormationPlan
    const playersWhoVotedForTeamSizeOne = []
    let teamSizeOneCount = 0
    teams.forEach(team => team.teamSize === 1 ? teamSizeOneCount++ : '')
    console.log('Team Size One Count', teamSizeOneCount)

    if (teamSizeOneCount) {
      this.pool.votes.forEach(player =>
        teams.forEach(team => {
          if(player.votes[0] === team.goalDescriptor && team.teamSize === 1 ) {
            playersWhoVotedForTeamSizeOne.push(player)
          }
        })
      )
    }

    console.log('Player Votes', playersWhoVotedForTeamSizeOne)

    return teamSizeOneCount / playersWhoVotedForTeamSizeOne.length
  }
}
