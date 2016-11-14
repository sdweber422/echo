import {getPlayerIds} from './pool'
import {enumeratePartitionings} from './partitioning'

export default function * enumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const playerIdsToAssign = getPlayerIds(pool)
  yield * enumeratePlayerAssignmentChoicesFromList({
    pool,
    teamFormationPlan,
    playerIdsToAssign,
    shouldPrune,
    getCountToAssign: team => team.teamSize,
  })
}

function * enumeratePlayerAssignmentChoicesFromList({teamFormationPlan, playerIdsToAssign, shouldPrune, getCountToAssign}) {
  const totalSeatsByGoal = new Map()
  teamFormationPlan.teams.forEach(team => {
    const countedSeatsForGoal = totalSeatsByGoal.get(team.goalDescriptor) || 0
    totalSeatsByGoal.set(team.goalDescriptor, countedSeatsForGoal + getCountToAssign(team))
  })

  const goalDescriptors = Array.from(totalSeatsByGoal.keys())
  const goalPartitionSizes = Array.from(totalSeatsByGoal.values())
  const goalPartitionings = enumeratePartitionings(
    playerIdsToAssign,
    goalPartitionSizes,
    genShouldPrunePartitioningByGoal(shouldPrune, teamFormationPlan, goalDescriptors, getCountToAssign),
  )

  for (const goalPartitioning of goalPartitionings) {
    const teamPartitioning = goalPartitioningToTeamPartitioning(goalPartitioning, teamFormationPlan, goalDescriptors, getCountToAssign)

    const teams = teamFormationPlan.teams.map((team, i) => {
      const currentPlayerIds = team.playerIds || []
      const playerIds = currentPlayerIds.concat(teamPartitioning[i])
      return {...team, playerIds}
    })

    yield {...teamFormationPlan, teams}
  }
}

function genShouldPrunePartitioningByGoal(shouldPrunePlan, teamFormationPlan, goalDescriptors, getCountToAssign) {
  return partitioning => {
    if (!shouldPrunePlan) {
      return false
    }
    const partitioningByTeam = goalPartitioningToTeamPartitioning(partitioning, teamFormationPlan, goalDescriptors, getCountToAssign)
    const teams = teamFormationPlan.teams.map((team, i) => ({
      ...team,
      playerIds: (team.playerIds || []).concat(partitioningByTeam[i]),
    }))

    return shouldPrunePlan({...teamFormationPlan, teams})
  }
}

function goalPartitioningToTeamPartitioning(playerPartitioningByGoal, teamFormationPlan, goalDescriptors, getCountToAssign) {
  const teams = teamFormationPlan.teams
  const playerIdsByGoal = getPlayerIdsByGoal(playerPartitioningByGoal, goalDescriptors)
  return teams.map(team => {
    const unusedIds = playerIdsByGoal[team.goalDescriptor] || []
    const playerIds = unusedIds.splice(0, getCountToAssign(team))

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
