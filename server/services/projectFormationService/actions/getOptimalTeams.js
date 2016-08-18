import {scoreOnObjectives} from '../objectives'

import {
  getGoalsWithVotesSortedByPopularity,
  getPlayerIds,
} from '../pool'

export default function getOptimalTeams(pool, {returnStats} = {}) {
  let bestFit
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0

  for (const goalConfiguration of getPossibleGoalConfigurations(pool)) {
    goalConfigurationsChecked++

    for (const teamConfiguration of getPossibleTeamConfigurations(pool, goalConfiguration)) {
      teamConfigurationsChcked++

      const score = scoreOnObjectives(pool, teamConfiguration)

      if (!bestFit || bestFit.score < score) {
        bestFit = {teams: teamConfiguration, score}
      }
    }
  }

  if (returnStats) {
    return {...bestFit, goalConfigurationsChecked, teamConfigurationsChcked}
  }

  return bestFit.teams
}

function getPossibleTeamConfigurations(pool, goalConfiguration) {
  const playerIds = getPlayerIds(pool)

  const playerPartitionings = getPossiblePartitionings(playerIds, goalConfiguration.map(_ => _.teamSize))

  return playerPartitionings.map(partitioning =>
    partitioning.map((playerIds, i) => ({
      goalDescriptor: goalConfiguration[i].goalDescriptor, playerIds
    }))
  )
}

export function getPossiblePartitionings(list, paritionSizes, partitions) {
  partitions = partitions || paritionSizes.map(() => [])

  if (list.length === 0) {
    return [partitions]
  }

  const [next, ...rest] = list
  return partitions.map((partition, i) => {
    if (partition.length === paritionSizes[i]) {
      return []
    }

    const newPartitions = partitions.slice(0)
    const newPartition = partition.slice(0)
    newPartition.push(next)
    newPartitions[i] = newPartition
    return getPossiblePartitionings(rest, paritionSizes, newPartitions)
  })
    .reduce((result, array) => result.concat(array))
}

export function getPossibleGoalConfigurations(pool) {
  const teamSizesByGoal = pool.goals.reduce((result, goal) => ({[goal.goalDescriptor]: goal.teamSize, ...result}), {})
  const goals = getGoalsWithVotesSortedByPopularity(pool)

  const goalAndSizeOptions = goals.reduce((result, goalDescriptor) => {
    const options = [
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor]},
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] + 1},
    ]
    if (teamSizesByGoal[goalDescriptor] > 3) {
      options.push({goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] - 1})
    }
    return result.concat(options)
  }, [])

  const smalestOption = goalAndSizeOptions.reduce(
    (result, option) => result && result < option.teamSize ? result : option.teamSize
  )

  const poolSize = pool.votes.length

  return _getPossibleGoalConfigurations([], {goalAndSizeOptions, smalestOption, poolSize})
}

function _getPossibleGoalConfigurations(chosenOptions, {goalAndSizeOptions, poolSize, smalestOption}) {
  const totalTeamCapacity = chosenOptions.reduce((result, option) => result + option.teamSize, 0)

  if (totalTeamCapacity === poolSize) {
    return [chosenOptions.sort(compareGoals)]
  }

  if (poolSize - totalTeamCapacity < smalestOption) {
    return []
  }

  return goalAndSizeOptions.map(option =>
    _getPossibleGoalConfigurations(chosenOptions.concat([option]), {goalAndSizeOptions, poolSize, smalestOption})
  )
    .reduce((result, array) => result.concat(array))
    .sort(compareGoalConfigurations)
    .reduce(uniqueCombinationsReducer, [])
}

function compareGoalConfigurations(a, b) {
  for (let i = 0; i < a.length; i++) {
    const comparison = compareGoals(a[i], b[i])
    if (comparison !== 0) {
      return comparison
    }
  }
  return 0
}

function compareGoals(a, b) {
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
