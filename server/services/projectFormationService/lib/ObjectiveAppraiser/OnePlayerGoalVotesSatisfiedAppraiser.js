import {getTeamSizeForGoal, getVotesByPlayerId} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
    this.secondChoiceValue = 0
  }

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    const {teams} = teamFormationPlan

    const onePlayerGoalVoterIds = this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).map(_ => _.playerId)

    if (!teamsAreIncomplete) {
      const onePlayerGoalVotesSatisfied = teams.filter(team =>
        this.satisfiesOnePlayerGoalVote(team)
      ).length

      return onePlayerGoalVotesSatisfied / onePlayerGoalVoterIds.length
    }
    const unassignedPlayerIds = this.getUnassignedPlayers(teams)
    const unassignedOnePlayerGoalVoterIds = unassignedPlayerIds.filter(id =>
      onePlayerGoalVoterIds.includes(id)
    )
    const rawScore = this.bestPossibleRawScoreForUnassignedPlayers(
      teamFormationPlan,
      new Set(unassignedOnePlayerGoalVoterIds),
      unassignedPlayerIds.length
    )

    return rawScore / unassignedOnePlayerGoalVoterIds.length
  }

  getUnassignedPlayers(teams) {
    const playerIds = []
    const players = teams.reduce((playerIds, team) =>
      playerIds.concat(team.playerIds)
    , [])

    this.pool.votes.forEach(player =>
      !players.includes(player.playerId) ? playerIds.push(player.playerId) : null
    )
    return playerIds
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
