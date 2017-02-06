import {getTeamSizeForGoal, voteCountsByGoal, getVotesByPlayerId} from '../pool'

export default class TeamSizeOneGoalAppraiser {
  constructor(pool) {
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
  }

  // so we need to chack if someone got or can get their goal.
  // to score them

  score(teamFormationPlan /* , {teamsAreIncomplete} = {} */) {
    const {teams} = teamFormationPlan

    // console.log('>>DUMP:', JSON.stringify(this.pool, null, 4))

    const numPlayersGotTheirVote = teams.filter(team =>
      this.playerGotTheirVote(team)
    ).length

    const playersTeamSizeOneVote = this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).length

    const score = numPlayersGotTheirVote / playersTeamSizeOneVote
    console.log('numPlayersGotTheirVote ====>', numPlayersGotTheirVote)
    console.log('playersTeamSizeOneVote ====>', playersTeamSizeOneVote)
    console.log('score ====>', score)

    if (isNaN(score)) {
      return 0
    } else if (score > 1) {
      return 1 / score
    }

    return score
  }

  playerGotTheirVote(team) {
    if(team.teamSize !== 1) {
      return false
    }

    console.log('Team ========>', team)
    const playerVotes = this.votesByPlayerId[team.playerIds[0]]
    console.log('playerVotes ==>', playerVotes)

    if(playerVotes[0] === team.goalDescriptor) {
      return true
    }
  }
}
