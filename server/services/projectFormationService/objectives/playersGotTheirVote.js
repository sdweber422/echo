import {
  getAdvancedPlayerIds,
  getNonAdvancedPlayerIds,
  getVotesByPlayerId,
  isAdvancedPlayerId,
} from '../pool'

export const SECOND_CHOICE_VALUE = 0.7

export default function playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly, regularPlayersOnly} = {}) {
  const votesByPlayerId = getVotesByPlayerId(pool)

  let playerTypeFilter
  let playerIds

  if (regularPlayersOnly) {
    playerIds = getNonAdvancedPlayerIds(pool)
    playerTypeFilter = playerId => !isAdvancedPlayerId(pool, playerId)
  } else if (advancedPlayersOnly) {
    playerIds = getAdvancedPlayerIds(pool)
    playerTypeFilter = playerId => isAdvancedPlayerId(pool, playerId)
  } else {
    throw new Error('You must specify either regularPlayersOnly or advancedPlayersOnly!')
  }
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
      countPlayersWhoGotTheirVote(0, matchingPlayerIds, team.goalDescriptor, votesByPlayerId) +
      (countPlayersWhoGotTheirVote(1, matchingPlayerIds, team.goalDescriptor, votesByPlayerId) * SECOND_CHOICE_VALUE)
  }, 0)

  const rawScoreForUnassignedPlayers = bestPossibleRawScoreForUnassignedPlayers(pool, teamFormationPlan, unassignedPlayerIds)

  const score = (rawScoreForAssignedPlayers + rawScoreForUnassignedPlayers) / playerCount

  // Make sure floating piont math never gives us more than 1.0
  return Math.min(1, score)
}

function emptySeatsByGoal(teamFormationPlan) {
  const result = new Map()
  teamFormationPlan.teams.forEach(team => {
    const emptySeats = team.teamSize - team.playerIds.length
    const currentCount = result.get(team.goalDescriptor) || 0
    result.set(team.goalDescriptor, currentCount + emptySeats)
  })
  return result
}

function bestPossibleRawScoreForUnassignedPlayers(pool, teamFormationPlan, unassignedPlayerIds) {
  const voteCounts = voteCountsByGoal(pool, unassignedPlayerIds)

  let sum = 0
  for (const [goalDescriptor, emptySeats] of emptySeatsByGoal(teamFormationPlan)) {
    const [firstVotesForGoal, secondVotesForGoal] = voteCounts.get(goalDescriptor)
    const potentialFirstChoiceAssignments = Math.min(emptySeats, firstVotesForGoal)
    const potentialSecondChoiceAssignments = Math.min(emptySeats - potentialFirstChoiceAssignments, secondVotesForGoal)
    sum += potentialFirstChoiceAssignments + (potentialSecondChoiceAssignments * SECOND_CHOICE_VALUE)
  }
  sum += seatsOnStillUnchosenGoals(pool, teamFormationPlan)
  return Math.min(sum, unassignedPlayerIds.length)
}

function seatsOnStillUnchosenGoals(pool, teamFormationPlan) {
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
