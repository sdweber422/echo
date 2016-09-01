import logger from 'src/server/services/projectFormationService/logger'
import {teamFormationPlanToString} from 'src/server/services/projectFormationService/teamFormationPlan'

import {
  getPlayerIds,
  getAdvancedPlayerIds,
  getNonAdvancedPlayerIds,
  getVotesByPlayerId,
} from 'src/server/services/projectFormationService/pool'

import {
  range,
  shuffle,
} from 'src/server/services/projectFormationService/util'

import {
  getPossiblePartitionings,
} from 'src/server/services/projectFormationService/actions/getOptimalTeams/partitioning'

export default function * ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const advancedPlayerAssignmentChoices = ennumerateAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  for (const teamFormationPlan of advancedPlayerAssignmentChoices) {
    logger.debug('Checking Advanced Player Assignment Choice: [', teamFormationPlanToString(teamFormationPlan), ']')
    yield * ennumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  }
}

function ennumerateAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const playerIds = getPlayerIds(pool)
  const advancedPlayerIds = getAdvancedPlayerIds(pool)
  const teamSizes = teamFormationPlan.teams.map(_ => _.teamSize)
  const totalSeats = teamSizes.reduce((sum, next) => sum + next, 0)
  const extraSeats = totalSeats - playerIds.length

  const playerIdList = advancedPlayerIds.slice(0)
  for (let i = 0; i < extraSeats; i++) {
    playerIdList.push(advancedPlayerIds[i % advancedPlayerIds.length])
  }
  const maxPerTeam = 1
  return ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, playerIdList, maxPerTeam, shouldPrune)
}

function * ennumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const nonAdvancedPlayerIds = getNonAdvancedPlayerIds(pool)
  yield * ennumerateRandomHeuristicPlayerAssignentsFromList(pool, teamFormationPlan, nonAdvancedPlayerIds, shouldPrune)
  // yield * ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, nonAdvancedPlayerIds, shouldPrune)
}

function * ennumerateRandomHeuristicPlayerAssignentsFromList(pool, teamFormationPlan, playerIdsToAssign, shouldPrune, count = 50) {
  const shufflingsSeen = new Set()

  for (let i = 0; i < count; i++) {
    const shuffledPlayerIds = shuffle(playerIdsToAssign)
    const shufflingKey = shuffledPlayerIds.toString()
    if (shufflingsSeen.has(shufflingKey)) {
      continue
    }
    shufflingsSeen.add(shufflingKey)

    const result = heuristicPlayerAssignment(pool, teamFormationPlan, shuffledPlayerIds)

    if (shouldPrune && shouldPrune(result)) {
      continue
    }

    yield result
  }
}

export function heuristicPlayerAssignment(pool, teamFormationPlan, playerIdsToAssign) {
  const votesByPlayerId = getVotesByPlayerId(pool)
  const votes = playerIdsToAssign.map(playerId => ({playerId, votes: votesByPlayerId[playerId]}))

  let teamsWithPlayers = teamFormationPlan.teams.map(team => {
    const newPlayerIds = range(0, team.teamSize - team.playerIds.length).map(() => {
      const matchingVoteIndex = votes.findIndex(
        vote => vote.votes[0] === team.goalDescriptor || vote.votes[1] === team.goalDescriptor
      )
      if (matchingVoteIndex >= 0) {
        const matchingVote = votes.splice(matchingVoteIndex, 1)[0]
        return matchingVote.playerId
      }
      return undefined
    }).filter(_ => _ !== undefined)
    return {...team, playerIds: team.playerIds.concat(newPlayerIds)}
  })

  teamsWithPlayers = teamsWithPlayers.map(team => {
    const newPlayerIds = votes.splice(0, team.teamSize - team.playerIds.length).map(_ => _.playerId)
    return {...team, playerIds: team.playerIds.concat(newPlayerIds)}
  })

  return {...teamFormationPlan, teams: teamsWithPlayers}
}

function * ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, unassignedPlayerIds, maxPerTeam, shouldPrune) {
  const goalConfiguration = teamFormationPlan.teams

  const totalSeatsByGoal = new Map()
  goalConfiguration.forEach(({goalDescriptor, teamSize}) => {
    const countedSeatsForGoal = totalSeatsByGoal.get(goalDescriptor) || 0
    totalSeatsByGoal.set(goalDescriptor, countedSeatsForGoal + (maxPerTeam ? maxPerTeam : teamSize - 1))
  })

  const goalDescriptors = Array.from(totalSeatsByGoal.keys())
  const goalPartitionSizes = Array.from(totalSeatsByGoal.values())
  const playerPartitioningsByGoal = getPossiblePartitionings(
    unassignedPlayerIds,
    goalPartitionSizes,
    genShouldPrunePartitioningByGoal(shouldPrune, teamFormationPlan, goalDescriptors, maxPerTeam),
  )

  for (const playerPartitioningByGoal of playerPartitioningsByGoal) {
    const partitioningByTeam = partitioningByTeamFromPartitioningByGoal(playerPartitioningByGoal, teamFormationPlan, goalDescriptors, maxPerTeam)

    const teams = teamFormationPlan.teams.map((team, i) => {
      const currentPlayerIds = team.playerIds || []
      const playerIds = currentPlayerIds.concat(partitioningByTeam[i])
      return {...team, playerIds}
    })

    yield {...teamFormationPlan, teams}
  }
}

function genShouldPrunePartitioningByGoal(shouldPrunePlan, teamFormationPlan, goalDescriptors, maxPerTeam) {
  return partitioning => {
    if (!shouldPrunePlan) {
      return false
    }
    const partitioningByTeam = partitioningByTeamFromPartitioningByGoal(partitioning, teamFormationPlan, goalDescriptors, maxPerTeam)
    const teams = teamFormationPlan.teams.map((team, i) => ({
      ...team,
      playerIds: (team.playerIds || []).concat(partitioningByTeam[i]),
    }))

    return shouldPrunePlan({...teamFormationPlan, teams})
  }
}

function partitioningByTeamFromPartitioningByGoal(playerPartitioningByGoal, teamFormationPlan, goalDescriptors, maxPerTeam) {
  const teams = teamFormationPlan.teams
  const playerIdsByGoal = getPlayerIdsByGoal(playerPartitioningByGoal, goalDescriptors)
  return teams.map(({goalDescriptor, teamSize}) => {
    const unusedIds = playerIdsByGoal[goalDescriptor] || []
    const playerIds = unusedIds.splice(0, maxPerTeam ? maxPerTeam : teamSize - 1)

    return playerIds
  })
}

function getPlayerIdsByGoal(playerPartitioning, goalDescriptors) {
  const playerIdsForGoal = {}
  playerPartitioning.forEach((playerIds, i) => {
    const goal = goalDescriptors[i]
    playerIdsForGoal[goal] = playerIdsForGoal[goal] || []
    playerIdsForGoal[goal].push(...playerIds)
  })
  return playerIdsForGoal
}
