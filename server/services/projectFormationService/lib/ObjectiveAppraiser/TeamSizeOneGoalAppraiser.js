export default class TeamSizeOneGoalAppraiser {
  constructor(pool) {
    this.pool = pool
  }

  score(teamFormationPlan /* , {teamsAreIncomplete} = {} */) {
    const {teams} = teamFormationPlan
    const teamSizeOneFormationCount = []

    teams.forEach(team =>
      team.teamSize === 1 ?
        teamSizeOneFormationCount.push(team.goalDescriptor) :
        null
    )
    if (!teamSizeOneFormationCount) {
      return 0
    }

    const teamSizeOneVotes = this.pool.votes.filter(player =>
      teamSizeOneFormationCount.includes(player.votes[0])
    )
    if (teamSizeOneVotes.length < teamSizeOneFormationCount.length) {
      return 1
    }

    const score = teamSizeOneVotes.length / teamSizeOneFormationCount.length

    if (isNaN(score)) {
      return 0
    } else if (isScoreGreaterThanOne(score)) {
      return 1 / score
    }

    return score
  }
}

function isScoreGreaterThanOne(score) {
  return score > 1
}
