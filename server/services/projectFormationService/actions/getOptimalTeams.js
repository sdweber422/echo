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

function * getPossibleTeamConfigurations(pool, goalConfiguration) {
  const playerIds = getPlayerIds(pool)
  const advancedPlayerIds = getAdvancedPlayerIds(pool)
  const teamSizes = goalConfiguration.map(_ => _.teamSize)
  const totalSeats = teamSizes.reduce((sum, next) => sum + next, 0)
  const extraSeats = totalSeats - playerIds.length

  if (extraSeats === 0 && teamSizes.length > advancedPlayerIds) {
    return
  }

  const duplicateAdvancedPlayerIds = []
  for (let i = 0; i < extraSeats; i++) {
    duplicateAdvancedPlayerIds.push(advancedPlayerIds[i % advancedPlayerIds.length])
  }

  const advancedPlayerPartitionings = getPossiblePartitionings(advancedPlayerIds.concat(duplicateAdvancedPlayerIds), teamSizes.map(() => 1))
  console.log('totalSeats', totalSeats, 'playerCount', playerIds.length)
  console.log('input:', extraSeats, duplicateAdvancedPlayerIds, advancedPlayerIds.concat(duplicateAdvancedPlayerIds), teamSizes.map(() => 1))
  console.log('advancedPlayerPartitionings:', partitioningsToStrings([...advancedPlayerPartitionings]))
  const playerPartitionings = getPossiblePartitionings(playerIds.concat(duplicateAdvancedPlayerIds), teamSizes, advancedPlayerIds)

  for (const partitioning of playerPartitionings) {
    yield partitioning.map((playerIds, i) => ({
      goalDescriptor: goalConfiguration[i].goalDescriptor, playerIds
    }))
  }
}

export function * getPossiblePartitionings(list, partitionSizes) {
  const unusedItemCount = new Map()
  list.forEach(item => unusedItemCount.set(item, (unusedItemCount.get(item) || 0) + 1))
  const nodeStack = [{partitioning: partitionSizes.map(() => []), unusedItemCount}]

  for (;;) {
    const currentNode = nodeStack.pop()

    if (!currentNode) {
      break
    }

    // logger.debug('[getPossiblePartitionings] Traversing Node:', partitioningsToStrings([currentNode.partitioning])[0])

    if (currentNode.partitioning.every((partition, i) => partition.length === partitionSizes[i])) {
      yield currentNode.partitioning
      continue
    }

    const unusedItemList = []
    for (const [k, v] of currentNode.unusedItemCount) {
      if (v > 0) {
        unusedItemList.push(k)
      }
    }

    let previousPartitionsAreFull = true
    for (let i = 0; i < currentNode.partitioning.length; i++) {
      const partition = currentNode.partitioning[i]

      if (partition.length === partitionSizes[i]) {
        previousPartitionsAreFull = true
        continue
      }

      if (!previousPartitionsAreFull) {
        break
      }
      previousPartitionsAreFull = false

      const itemCandidates = unusedItemList.filter(item => {
        const lastItemInPartition = partition[partition.length - 1]
        return !lastItemInPartition || lastItemInPartition < item
      })

      const newNodes = itemCandidates.map(item => {
        const newPartitioning = currentNode.partitioning.slice(0)
        const newPartition = partition.slice(0)
        newPartition.push(item)
        newPartitioning[i] = newPartition

        const unusedItemCount = new Map([...currentNode.unusedItemCount.entries()])
        unusedItemCount.set(item, unusedItemCount.get(item) - 1)
        return {
          partitioning: newPartitioning,
          unusedItemCount,
        }
      })
      nodeStack.push(...newNodes)
    }
  }
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
      teamCount: extraSeats + advancedPlayerCount,
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
    const teamCount = extraSeats + advancedPlayerCount
    const seatCount = poolSize + extraSeats
    return teamCount * smallestGoalSizeOption <= seatCount
  })
}

function range(start, length) {
  return Array.from(Array(length), (x, i) => i + start)
}

function * _getPossibleGoalConfigurations({goalAndSizeOptions, seatCount, smallestGoalSizeOption, teamCount}) {
  const nodeStack = goalAndSizeOptions.map(_ => [_])

  let count = 0
  for (;;) {
    const currentNode = nodeStack.pop()

    if (!currentNode) {
      return
    }

    const totalTeamCapacity = currentNode.reduce((result, option) => result + option.teamSize, 0)

    if (totalTeamCapacity === seatCount && currentNode.length === teamCount) {
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

function partitioningsToStrings(partitionings) {
  return partitionings.map(partitioning =>
    partitioning.map(partition =>
      `[${partition.sort().join(',')}]`
    ).join(', ')
  )
}
