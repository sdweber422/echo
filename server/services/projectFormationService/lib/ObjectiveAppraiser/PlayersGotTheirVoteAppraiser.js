import {
  getPlayerIds,
  getVotesByPlayerId,
  getPlayerIdsByVote,
} from '../pool'
import {getAssignedPlayerIds} from '../teamFormationPlan'

export default class PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
    this.playerIdsByVote = getPlayerIdsByVote(pool)
    this.playerIds = new Set(getPlayerIds(pool))
    this.playerIdsToConsider = this.playerIds
    this.secondChoiceValue = PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE
  }

  score(teamFormationPlan) {
    const {playerIdsToConsider} = this
    if (playerIdsToConsider.size === 0) {
      return 1
    }

    const rawScoreForAssignedPlayers = this.bestPossibleRawScoreForAssignedPlayers(
      teamFormationPlan,
      playerIdsToConsider
    )
    const givenUnassignedPlayerIds = this.getUnassignedPlayerIds(playerIdsToConsider, teamFormationPlan)
    const rawScoreForUnassignedPlayers = this.bestPossibleRawScoreForUnassignedPlayers(
      teamFormationPlan,
      givenUnassignedPlayerIds
    )

    const score = (rawScoreForAssignedPlayers + rawScoreForUnassignedPlayers) / playerIdsToConsider.size

    // Make sure floating piont math never gives us more than 1.0
    return Math.min(1, score)
  }

  bestPossibleRawScoreForAssignedPlayers(teamFormationPlan, givenPlayerIds) {
    const playersConsidered = new Set()
    const playerIdFilter = playerId => givenPlayerIds.has(playerId) && !playersConsidered.has(playerId)
    const rawScoreForAssignedPlayers = teamFormationPlan.teams.reduce((sum, team) => {
      const matchingPlayerIds = team.playerIds.filter(playerIdFilter)
      matchingPlayerIds.forEach(id => {
        playersConsidered.add(id)
      })
      const [firstChoice, secondChoice] = this.countPlayersWhoGotTheirVote(matchingPlayerIds, team.goalDescriptor)
      return sum +
      firstChoice +
      (secondChoice * this.secondChoiceValue)
    }, 0)
    return rawScoreForAssignedPlayers
  }

  bestPossibleRawScoreForUnassignedPlayers(teamFormationPlan, givenPlayerIds) {
    const totalUnassignedPlayerCount = this.getUnassignedPlayerIds(this.playerIds, teamFormationPlan).size
    const voteCounts = this.voteCountsByGoal(givenPlayerIds)

    let sum = 0
    let totalEmptySeats = 0
    for (const [goalDescriptor, emptySeats] of this.emptySeatsByGoal(teamFormationPlan)) {
      totalEmptySeats += emptySeats
      const [firstVotesForGoal, secondVotesForGoal] = voteCounts.get(goalDescriptor)
      const potentialFirstChoiceAssignments = Math.min(emptySeats, firstVotesForGoal)
      const potentialSecondChoiceAssignments = Math.min(emptySeats - potentialFirstChoiceAssignments, secondVotesForGoal)
      sum += potentialFirstChoiceAssignments + (potentialSecondChoiceAssignments * this.secondChoiceValue)
    }
    const playersWhoCouldGetTheirVoteOnUnformedTeams = Math.max(0, totalUnassignedPlayerCount - totalEmptySeats)
    sum += playersWhoCouldGetTheirVoteOnUnformedTeams
    return Math.min(sum, givenPlayerIds.size)
  }

  getUnassignedPlayerIds(playerIds, teamFormationPlan) {
    const assignedPlayerIds = new Set(getAssignedPlayerIds(teamFormationPlan))
    return new Set(
      Array.from(playerIds).filter(id => !assignedPlayerIds.has(id))
    )
  }

  countPlayersWhoGotTheirVote(playerIds, goalDescriptor) {
    const result = [0, 0]
    playerIds.forEach(playerId => {
      const votes = this.votesByPlayerId[playerId] || []
      result[0] += Number(votes[0] === goalDescriptor)
      result[1] += Number(votes[1] === goalDescriptor)
    })
    return result
  }

  emptySeatsByGoal(teamFormationPlan) {
    const result = new Map()
    teamFormationPlan.teams.forEach(team => {
      const emptySeats = team.teamSize - team.playerIds.length
      const currentCount = result.get(team.goalDescriptor) || 0
      result.set(team.goalDescriptor, currentCount + emptySeats)
    })
    return result
  }

  voteCountsByGoal(playerIds) {
    const result = new Map(this.pool.goals.map(({goalDescriptor}) => [goalDescriptor, [0, 0]]))
    for (const {playerId, votes} of this.pool.votes) {
      if (playerIds.has(playerId)) {
        votes.forEach((goalDescriptor, i) => {
          result.get(goalDescriptor)[i]++
        })
      }
    }
    return result
  }
}

PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE = 0.7
