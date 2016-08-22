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

export default function getOptimalTeams(pool) {
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0

  for (const goalConfiguration of getPossibleGoalConfigurations(pool)) {
    logger.log('Checking Goal Configuration:', goalConfigurationsToStrings([goalConfiguration]))

    for (const teamConfiguration of getPossibleTeamConfigurations(pool, goalConfiguration)) {
      const score = scoreOnObjectives(pool, teamConfiguration)

      if (bestFit.score < score) {
        bestFit = {teams: teamConfiguration, score}
        logger.log('Found New Best Fit with score:', score, bestFit.teams)
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

  const playerPartitionings = getPossiblePartitionings(playerIds, teamSizes)

  return playerPartitionings.map(partitioning =>
    partitioning.map((playerIds, i) => ({
      goalDescriptor: goalConfiguration[i].goalDescriptor, playerIds
    }))
  )
}

export function getPossiblePartitionings(list, partitionSizes, partitions) {
  partitions = partitions || partitionSizes.map(() => [])

  if (list.length === 0) {
    return [partitions]
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
    return getPossiblePartitionings(rest, partitionSizes, newPartitions)
  })
    .reduce((result, array) => result.concat(array))
}

export function getPossibleGoalConfigurations(pool) {
  const teamSizesByGoal = getTeamSizesByGoal(pool)
  const goals = getGoalsWithVotesSortedByPopularity(pool)

  const goalAndSizeOptions = goals.reduce((result, goalDescriptor) => {
    const options = [
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor], matchesTeamSizeRecommendation: true},
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] + 1},
    ]
    if (teamSizesByGoal[goalDescriptor] > 3) {
      options.push({goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] - 1})
    }

    return result.concat(options)
  }, [])

  const smallestGoalSizeOption = goalAndSizeOptions.reduce(
    (result, option) => result && result < option.teamSize ? result : option.teamSize
  )

  const poolSize = getPoolSize(pool)
  const advancedPlayerCount = getAdvancedPlayerCount(pool)

  const extraSeatScenarios = getValidExtraSeatCountScenarios({
    poolSize,
    smallestGoalSizeOption,
    advancedPlayerCount,
  })

  return extraSeatScenarios.map(extraSeats => {
    const minTeams = extraSeats + advancedPlayerCount
    return _getPossibleGoalConfigurations([], {
      goalAndSizeOptions,
      smallestGoalSizeOption,
      seatCount: poolSize + extraSeats,
    }).filter(configuration => configuration.length >= minTeams)
  })
   .reduce((result, array) => result.concat(array), [])
   .sort(compareGoalConfigurations)
   .reduce(uniqueCombinationsReducer, [])
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

  // The lagest valid number of extra seats in the scenario where
  // every advanced player is on a two person team with everyone else
  // in the pool. So in a 10 player pool with 2 advanced players there would be
  // 5 teams using 3 extra seats (poolSize / advancedPlayerCount - advancedPlayerCount)
  const maxExtraSeats = (poolSize / advancedPlayerCount) - advancedPlayerCount

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

function _getPossibleGoalConfigurations(chosenOptions, {goalAndSizeOptions, seatCount, smallestGoalSizeOption}) {
  const totalTeamCapacity = chosenOptions.reduce((result, option) => result + option.teamSize, 0)

  if (totalTeamCapacity === seatCount) {
    return [chosenOptions.sort(compareGoals)]
  }

  if (seatCount - totalTeamCapacity < smallestGoalSizeOption) {
    return []
  }

  return goalAndSizeOptions.map(option =>
    _getPossibleGoalConfigurations(chosenOptions.concat([option]), {
      goalAndSizeOptions,
      seatCount,
      smallestGoalSizeOption
    })
  )
    .reduce((result, array) => result.concat(array), [])
}

function compareGoalConfigurations(a, b) {
  const appropriatenessComparison = compareGoalConfigurationsByTeamSizeAppropriateness(a, b)
  if (appropriatenessComparison !== 0) {
    return appropriatenessComparison
  }

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const comparison = compareGoals(a[i], b[i])
    if (comparison !== 0) {
      return comparison
    }
  }

  return 0
}

function compareGoalConfigurationsByTeamSizeAppropriateness(a, b) {
  const perfectSizeCountA = a.filter(_ => !_.matchesTeamSizeRecommendation).length
  const perfectSizeCountB = b.filter(_ => !_.matchesTeamSizeRecommendation).length
  return perfectSizeCountA - perfectSizeCountB
}

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

function uniqueCombinationsReducer(result, next) {
  const last = result[result.length - 1]
  if (last && compareGoalConfigurations(last, next) === 0) {
    return result
  }
  return result.concat([next])
}

export function goalConfigurationsToStrings(goalConfigurations) {
  return goalConfigurations.map(combination =>
    combination.map(({goalDescriptor, teamSize}) => `${goalDescriptor}:${teamSize}`).join(', ')
  )
}
