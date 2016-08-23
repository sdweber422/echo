import {scoreOnObjectives} from '../objectives'

import logger from '../logger'
import {
  getGoalsWithVotesSortedByPopularity,
  getPlayerIds,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
  getAdvancedPlayerIds,
} from '../pool'

const MIN_TEAM_SIZE = 2

export default function getOptimalTeams(pool) {
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0

  for (const goalConfiguration of getPossibleGoalConfigurations(pool)) {
    logger.log('Checking Goal Configuration:', goalConfigurationsToStrings([goalConfiguration]))

    // console.log('teamConfigurations', getPossibleTeamConfigurations(pool, goalConfiguration).length)
    for (const teamConfiguration of getPossibleTeamConfigurations(pool, goalConfiguration)) {
      const score = scoreOnObjectives(pool, teamConfiguration)

      if (bestFit.score < score) {
        logger.log('Found New Best Fit with score:', score)
        logger.debug('Team Configuration:', teamConfigurationToString(teamConfiguration))

        bestFit = {teams: teamConfiguration, score}

        if (bestFit.score === 1) {
          logger.log('Goal Configurations Checked:', goalConfigurationsChecked)
          logger.log('Team Configurations Chcked:', teamConfigurationsChcked)
          return bestFit.teams
        }
      }

      teamConfigurationsChcked++
    }
    goalConfigurationsChecked++

    logger.log('Goal Configurations Checked:', goalConfigurationsChecked)
    logger.log('Team Configurations Chcked:', teamConfigurationsChcked)
  }

  if (!bestFit.teams) {
    throw new Error('Unable to find any valid team configuration for this pool')
  }

  return bestFit.teams
}

function getPossibleTeamConfigurations(pool, goalConfiguration) {
  const playerIds = getPlayerIds(pool).slice(0)
  const advancedPlayerIds = getAdvancedPlayerIds(pool)
  const teamSizes = goalConfiguration.map(_ => _.teamSize)
  const totalSeats = teamSizes.reduce((sum, next) => sum + next, 0)
  const extraSeats = totalSeats - playerIds.length

  for (let i = 0; i < extraSeats; i++) {
    playerIds.push(advancedPlayerIds[i % advancedPlayerIds.length])
  }

  const playerPartitionings = getPossiblePartitionings(playerIds, teamSizes, advancedPlayerIds)

  return playerPartitionings.map(partitioning =>
    partitioning.map((playerIds, i) => ({
      goalDescriptor: goalConfiguration[i].goalDescriptor, playerIds
    }))
  )
}

export function getPossiblePartitionings(list, partitionSizes, advancedPlayerIds = [], partitions = null) {
  partitions = partitions || partitionSizes.map(() => [])

  if (list.length === 0) {
    return [partitions]
  }

  // Reject partitionings that contain teams with no advanced players
  if (advancedPlayerIds.length > 0) {
    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i]
      if (partition.length === partitionSizes[i] && !partition.some(item => advancedPlayerIds.includes(item))) {
        return []
      }
    }
  }

  const [next, ...rest] = list
  return partitions.map((partition, i) => {
    if (partition.length === partitionSizes[i]) {
      return []
    }

    const newPartitions = partitions.slice(0)
    const newPartition = partition.slice(0)
    newPartition.push(next)
    newPartitions[i] = newPartition
    return getPossiblePartitionings(rest, partitionSizes, advancedPlayerIds, newPartitions)
  })
    .reduce((result, array) => result.concat(array))
}

export function * getPossibleGoalConfigurations(pool) {
  const teamSizesByGoal = getTeamSizesByGoal(pool)
  const goals = getGoalsWithVotesSortedByPopularity(pool)

  const goalAndSizeOptions = goals.reduce((result, goalDescriptor) => {
    const options = [
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor], matchesTeamSizeRecommendation: true},
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] + 1},
    ]
    if (teamSizesByGoal[goalDescriptor] > MIN_TEAM_SIZE) {
      options.push({goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] - 1})
    }

    return result.concat(options)
  }, [])

  const smallestGoalSizeOption = goalAndSizeOptions.sort(
    (a, b) => a.teamSize - b.teamSize
  )[0].teamSize

  const poolSize = getPoolSize(pool)
  const advancedPlayerCount = getAdvancedPlayerCount(pool)

  const extraSeatScenarios = getValidExtraSeatCountScenarios({
    poolSize,
    smallestGoalSizeOption,
    advancedPlayerCount,
  })

  for (const extraSeats of extraSeatScenarios) {
    yield * _getPossibleGoalConfigurations({
      goalAndSizeOptions,
      smallestGoalSizeOption,
      seatCount: poolSize + extraSeats,
      minTeams: extraSeats + advancedPlayerCount,
    })
  }
}

function getValidExtraSeatCountScenarios({poolSize, smallestGoalSizeOption, advancedPlayerCount}) {
  // When advanced players are on multiple teams it creates
  // a scenario where we need extra seats on the teams since
  // one player is using multiple seats.
  //
  // Given a certain pool size and smallest possible project size
  // there are a limited muber of valid extra seat configurations.
  // This method returns a list of those configurations represented by the
  // number of aditional seats.

  // If everyone is on only 1 team there are no extra seats
  const minExtraSeats = 0

  const maxExtraSeats = Math.floor(poolSize / MIN_TEAM_SIZE) - advancedPlayerCount

  return range(minExtraSeats, maxExtraSeats).filter(extraSeats => {
    // We can further filter the list of valid scenarios by only
    // considering cases where the seatCount can accomodate the
    // number of teams implied by the number of extra seats.
    const minTeams = extraSeats + advancedPlayerCount
    const seatCount = poolSize + extraSeats
    return minTeams * smallestGoalSizeOption <= seatCount
  })
}

function range(start, length) {
  return Array.from(Array(length), (x, i) => i + start)
}

function * _getPossibleGoalConfigurations({goalAndSizeOptions, seatCount, smallestGoalSizeOption, minTeams}) {
  const nodeStack = goalAndSizeOptions.map(_ => [_])

  let count = 0
  while (true) {
    const currentNode = nodeStack.pop()

    if (!currentNode) {
      return
    }

    const totalTeamCapacity = currentNode.reduce((result, option) => result + option.teamSize, 0)

    if (totalTeamCapacity === seatCount && currentNode.length >= minTeams) {
      count++
      if (count % 10000 === 0) {
        logger.debug('[_getPossibleGoalConfigurations] currentNode:', count, goalConfigurationsToStrings([currentNode])[0])
      }
      yield currentNode
    }

    if (seatCount - totalTeamCapacity >= smallestGoalSizeOption) {
      nodeStack.push(...goalAndSizeOptions
        // Skipping all nodes that are not sorted to ensure that we won't
        // add children that will be duplicates of nodes further left in the tree
        .filter(option => compareGoals(option, currentNode[currentNode.length - 1]) >= 0)
        .map(option => currentNode.concat(option))
      )
    }
  }
}

// function compareGoalConfigurations(a, b) {
//   const appropriatenessComparison = compareGoalConfigurationsByTeamSizeAppropriateness(a, b)
//   if (appropriatenessComparison !== 0) {
//     return appropriatenessComparison
//   }

//   for (let i = 0; i < Math.max(a.length, b.length); i++) {
//     const comparison = compareGoals(a[i], b[i])
//     if (comparison !== 0) {
//       return comparison
//     }
//   }

//   return 0
// }

// function compareGoalConfigurationsByTeamSizeAppropriateness(a, b) {
//   const perfectSizeCountA = a.filter(_ => !_.matchesTeamSizeRecommendation).length
//   const perfectSizeCountB = b.filter(_ => !_.matchesTeamSizeRecommendation).length
//   return perfectSizeCountA - perfectSizeCountB
// }

function compareGoals(a, b) {
  if (a && !b) {
    return 1
  }
  if (b && !a) {
    return -1
  }
  if (a.goalDescriptor > b.goalDescriptor) {
    return 1
  }
  if (a.goalDescriptor < b.goalDescriptor) {
    return -1
  }
  return a.teamSize - b.teamSize
}

export function goalConfigurationsToStrings(goalConfigurations) {
  return goalConfigurations.map(combination =>
    combination.map(({goalDescriptor, teamSize}) => `${goalDescriptor}:${teamSize}`).join(', ')
  )
}

function teamConfigurationToString(teamConfiguration) {
  return teamConfiguration.map(({goalDescriptor, playerIds}) => `(goal:${goalDescriptor})[${playerIds}]`).join(', ')
}
