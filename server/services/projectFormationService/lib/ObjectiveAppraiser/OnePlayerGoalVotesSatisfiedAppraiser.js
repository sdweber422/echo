import {getTeamSizeForGoal} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.secondChoiceValue = 0
  }

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    const {teams} = teamFormationPlan

    const unassignedPlayerIds = this.getUnassignedPlayerIds(teams)

    const onePlayerGoalVoterIds = this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).map(_ => _.playerId)

    const unassignedOnePlayerGoalVoterIds = unassignedPlayerIds.filter(id =>
      onePlayerGoalVoterIds.includes(id)
    )

    const givenPlayerIds = new Set(onePlayerGoalVoterIds)
    const givenUnassignedPlayerIds = new Set(unassignedOnePlayerGoalVoterIds)
    const totalUnassignedPlayerCount = unassignedPlayerIds.length

    return this.getScoreForGivenPlayers(teamFormationPlan, {
      givenPlayerIds,
      givenUnassignedPlayerIds,
      totalUnassignedPlayerCount,
    })
  }

  satisfiesOnePlayerGoalVote(team) {
    if (team.teamSize !== 1) {
      return false
    }
    const playerVotes = this.votesByPlayerId[team.playerIds[0]]
    if (playerVotes[0] === team.goalDescriptor) {
      return true
    }
  }
}
