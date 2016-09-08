// import getProfiler from 'src/server/services/projectFormationService/profile'

import {
  getPlayerIds,
  getVotesByPlayerId,
  getPlayerIdsByVote,
} from '../pool'

export default class PlayersGotTheirVoteAppraiser {
  constructor(pool, playerIds) {
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
    this.playerIdsByVote = getPlayerIdsByVote(pool)
    this.playerIds = new Set(playerIds || getPlayerIds(pool))
  }

  score(teamFormationPlan) {
    const {playerIds} = this
    const playerCount = playerIds.size

    // Don't consider players on multiple teams multiple times.
    const unassignedPlayerIds = new Set(playerIds)
    const playersConsidered = new Set()
    const playerIdFilter = playerId => {
      // TODO: use a set for this filter
      return playerIds.has(playerId) && !playersConsidered.has(playerId)
    }

    // getProfiler().start('rawScoreForAssignedPlayers')
    const rawScoreForAssignedPlayers = teamFormationPlan.teams.reduce((sum, team) => {
      // getProfiler().start('getMatchingPlayerIds')
      const matchingPlayerIds = team.playerIds.filter(playerIdFilter)
      // getProfiler().pause('getMatchingPlayerIds')

      // getProfiler().start('updateSets')
      matchingPlayerIds.forEach(id => {
        playersConsidered.add(id)
        unassignedPlayerIds.delete(id)
      })
      // getProfiler().pause('updateSets')

      // getProfiler().start('calcNewSum')
      const [firstChoice, secondChoice] = this.countPlayersWhoGotTheirVote(matchingPlayerIds, team.goalDescriptor)
      const newSum = sum +
        firstChoice +
        (secondChoice * PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE)
      // getProfiler().pause('calcNewSum')

      return newSum
    }, 0)
    // getProfiler().pause('rawScoreForAssignedPlayers')

    // getProfiler().start('rawScoreForUnassignedPlayers')
    const rawScoreForUnassignedPlayers = this.bestPossibleRawScoreForUnassignedPlayers(teamFormationPlan, unassignedPlayerIds)
    // getProfiler().pause('rawScoreForUnassignedPlayers')

    const score = (rawScoreForAssignedPlayers + rawScoreForUnassignedPlayers) / playerCount

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
    return Math.min(sum, unassignedPlayerIds.size)
  }

  countPlayersWhoGotTheirVote(playerIds, goalDescriptor) {
    // getProfiler().start('countPlayersWhoGotTheirVote')
    const result = [0, 0]
    playerIds.forEach(playerId => {
      const votes = this.votesByPlayerId[playerId]
      result[0] += Number(votes[0] === goalDescriptor)
      result[1] += Number(votes[1] === goalDescriptor)
    })
    // getProfiler().pause('countPlayersWhoGotTheirVote')
    return result
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
    if (playerIds.has(playerId)) {
      votes.forEach((goalDescriptor, i) => {
        result.get(goalDescriptor)[i]++
      })
    }
  }
  return result
}

