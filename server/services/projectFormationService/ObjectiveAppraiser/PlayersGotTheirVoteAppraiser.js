import profile from '../profile'

import {
  getAdvancedPlayerIds,
  getNonAdvancedPlayerIds,
  getVotesByPlayerId,
  isAdvancedPlayerId,
} from '../pool'

export default class PlayersGotTheirVoteAppraiser {
  constructor(pool, options = {}) {
    profile.start('playersGotTheirVoteAppraiser-initialization')
    this.pool = pool
    this.options = options

    const {advancedPlayersOnly, regularPlayersOnly} = this.options

    if (regularPlayersOnly) {
      this.playerIds = getNonAdvancedPlayerIds(pool)
      this.playerTypeFilter = playerId => !isAdvancedPlayerId(pool, playerId)
    } else if (advancedPlayersOnly) {
      this.playerIds = getAdvancedPlayerIds(pool)
      this.playerTypeFilter = playerId => isAdvancedPlayerId(pool, playerId)
    } else {
      throw new Error('You must specify either regularPlayersOnly or advancedPlayersOnly!')
    }

    this.votesByPlayerId = getVotesByPlayerId(pool)
    profile.pause('playersGotTheirVoteAppraiser-initialization')
  }

  score(teamFormationPlan) {
    profile.start('playersGotTheirVoteAppraiser-score')
    const {playerIds, playerTypeFilter} = this
    const playerCount = playerIds.length

    // Don't consider players on multiple teams multiple times.
    const unassignedPlayerIds = playerIds.slice(0)
    const playersConsidered = []
    const playerIdFilter = playerId => {
      return playerTypeFilter(playerId) && !playersConsidered.includes(playerId)
    }

    const rawScoreForAssignedPlayers = teamFormationPlan.teams.reduce((sum, team) => {
      const matchingPlayerIds = team.playerIds.filter(playerIdFilter)
      playersConsidered.push(...matchingPlayerIds)
      matchingPlayerIds.forEach(id => unassignedPlayerIds.splice(unassignedPlayerIds.indexOf(id), 1))
      return sum +
        countPlayersWhoGotTheirVote(0, matchingPlayerIds, team.goalDescriptor, this.votesByPlayerId) +
        (countPlayersWhoGotTheirVote(1, matchingPlayerIds, team.goalDescriptor, this.votesByPlayerId) * PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE)
    }, 0)

    const rawScoreForUnassignedPlayers = this.bestPossibleRawScoreForUnassignedPlayers(teamFormationPlan, unassignedPlayerIds)

    const score = (rawScoreForAssignedPlayers + rawScoreForUnassignedPlayers) / playerCount

    profile.pause('playersGotTheirVoteAppraiser-score')
    // Make sure floating piont math never gives us more than 1.0
    return Math.min(1, score)
  }

  bestPossibleRawScoreForUnassignedPlayers(teamFormationPlan, unassignedPlayerIds) {
    const voteCounts = voteCountsByGoal(this.pool, unassignedPlayerIds)

    let sum = 0
    for (const [goalDescriptor, emptySeats] of emptySeatsByGoal(teamFormationPlan)) {
      const [firstVotesForGoal, secondVotesForGoal] = voteCounts.get(goalDescriptor)
      const potentialFirstChoiceAssignments = Math.min(emptySeats, firstVotesForGoal)
      const potentialSecondChoiceAssignments = Math.min(emptySeats - potentialFirstChoiceAssignments, secondVotesForGoal)
      sum += potentialFirstChoiceAssignments + (potentialSecondChoiceAssignments * PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE)
    }
    sum += seatsOnStillUnchosenGoals(teamFormationPlan)
    return Math.min(sum, unassignedPlayerIds.length)
  }

}

PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE = 0.7

function emptySeatsByGoal(teamFormationPlan) {
  const result = new Map()
  teamFormationPlan.teams.forEach(team => {
    const emptySeats = team.teamSize - team.playerIds.length
    const currentCount = result.get(team.goalDescriptor) || 0
    result.set(team.goalDescriptor, currentCount + emptySeats)
  })
  return result
}

function seatsOnStillUnchosenGoals(teamFormationPlan) {
  const totalSeatsSoFar = teamFormationPlan.teams.reduce((sum, team) => sum + team.teamSize, 0)
  return teamFormationPlan.seatCount - totalSeatsSoFar
}

function voteCountsByGoal(pool, playerIds) {
  const result = new Map(pool.goals.map(({goalDescriptor}) => [goalDescriptor, [0, 0]]))
  for (const {playerId, votes} of pool.votes) {
    if (playerIds.includes(playerId)) {
      votes.forEach((goalDescriptor, i) => {
        result.get(goalDescriptor)[i]++
      })
    }
  }
  return result
}

function countPlayersWhoGotTheirVote(voteIndex, playerIds, goalDescriptor, votesByPlayerId) {
  return playerIds.filter(playerId =>
    votesByPlayerId[playerId][voteIndex] === goalDescriptor
  ).length
}
