import {getTeamSizeForGoal, getVotesByPlayerId} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
  }

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    const {teams} = teamFormationPlan


    // console.log('Pool', this.pool)
    // // console.log('>>DUMP:', JSON.stringify(this.pool, null, 4))
    // const unassignedPlayerIds = teams.filter(team => {
    //   team.unassignedPlayerIds = new Set(team.playerIds)
    // })
    //
    // const rawScore = this.bestPossibleRawScoreForUnassignedPlayers(
    //   teamFormationPlan,
    //   unassignedPlayerIds
    // )


    // assigned player
    const numPlayersGotTheirVote = teams.filter(team =>
      this.playerGotTheirVote(team)
    ).length

    const allTeamSizeOneVotes = this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).length

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
