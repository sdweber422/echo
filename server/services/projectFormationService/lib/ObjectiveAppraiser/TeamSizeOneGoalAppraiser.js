import {getTeamSizeForGoal, getVotesByPlayerId, getGoalsWithVotes} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
  }

// players vote for team size one goals

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    const {teams} = teamFormationPlan
    // console.log('>>DUMP:', JSON.stringify(this.pool, null, 4))

    const unAssignedTeams = teams.filter(team =>
      getGoalsWithVotes(this.pool) === 0
    ).length

    const numPlayersGotTheirVote = teams.filter(team =>
      this.playerGotTheirVote(team)
    ).length

    const allTeamSizeOneVotes = this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).length

    console.log('unAssignedTeams', unAssignedTeams)
    console.log('numPlayersGotTheirVote', numPlayersGotTheirVote)
    console.log('allTeamSizeOneVotes', allTeamSizeOneVotes)

    return numPlayersGotTheirVote / allTeamSizeOneVotes
  }

  playerGotTheirVote(team) {
    if(team.teamSize !== 1) {
      return false
    }

    const playerVotes = this.votesByPlayerId[team.playerIds[0]]

    if(playerVotes[0] === team.goalDescriptor) {
      return true
    }
  }
}
