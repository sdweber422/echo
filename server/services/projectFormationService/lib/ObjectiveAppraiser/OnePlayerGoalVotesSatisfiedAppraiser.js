import {getTeamSizeForGoal} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.secondChoiceValue = 0
    this.playerIdsToConsider = new Set(this.getOnePlayerGoalVoterIds())
  }

  getOnePlayerGoalVoterIds() {
    return this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).map(_ => _.playerId)
  }
}
