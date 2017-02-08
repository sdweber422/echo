import {getTeamSizeForGoal} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.secondChoiceValue = 0
  }

  score(teamFormationPlan) {
    const {teams} = teamFormationPlan

    const unassignedPlayerIds = this.getUnassignedPlayerIds(teams)

    const onePlayerGoalVoterIds = this.getOnePlayerGoalVoterIds()

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

  getOnePlayerGoalVoterIds() {
    return this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).map(_ => _.playerId)
  }
}
