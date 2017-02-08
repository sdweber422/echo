import {getTeamSizeForGoal} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.secondChoiceValue = 0
    this.onePlayerGoalVoterIds = new Set(this.getOnePlayerGoalVoterIds())
  }

  score(teamFormationPlan) {
    const {teams} = teamFormationPlan
    const unassignedPlayerIds = this.getUnassignedPlayerIds(teams)

    return this.getScoreForGivenPlayers({
      teamFormationPlan,
      givenPlayerIds: this.onePlayerGoalVoterIds,
      totalUnassignedPlayerCount: unassignedPlayerIds.length,
    })
  }

  getOnePlayerGoalVoterIds() {
    return this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).map(_ => _.playerId)
  }
}
