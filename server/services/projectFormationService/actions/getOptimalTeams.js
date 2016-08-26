import {scoreOnObjectives} from '../objectives'

import logger from '../logger'
import {
  getGoalsWithVotesSortedByPopularity,
  getPlayerIds,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
  getAdvancedPlayerIds,
  getNonAdvancedPlayerIds,
} from '../pool'

const MIN_TEAM_SIZE = 2

const logCount = (name, interval, count) => count % interval || console.log('>>>>>>>COUNT ', name, count)

export default function getOptimalTeams(pool) {
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0
  let branchesPruned = 0
  let nodesTraversed = 0

  const logStats = () => {
    logger.log('Goal Configurations Checked:', goalConfigurationsChecked)
    logger.log('Branches Pruned:', branchesPruned)
    logger.log('Team Configurations Chcked:', teamConfigurationsChcked)
    logger.log('Nodes Traversed', nodesTraversed)
  }

  const shouldPrune = partialTeamConfig => {
    logCount('nodesTraversed', 1000, nodesTraversed++)
    const score = scoreOnObjectives(pool, partialTeamConfig, {teamsAreIncomplete: true})
    const prune = score < bestFit.score
    console.log(`NODE [${prune ? '-' : '+'}]`, teamConfigurationToString(partialTeamConfig), score)
    if (prune) {
      branchesPruned++
      logCount('branchesPruned', 1000, branchesPruned)
    }
    return prune
  }

  for (const goalConfiguration of getPossibleGoalConfigurations(pool)) {
    logger.log('Checking Goal Configuration: [', goalConfigurationToString(goalConfiguration), ']')

    for (const teamConfiguration of getPossibleTeamConfigurations(pool, goalConfiguration, shouldPrune)) {
      const score = scoreOnObjectives(pool, teamConfiguration)
      console.log(`NODE [*]`, teamConfigurationToString(teamConfiguration), score)
      // console.log('Considering Team Configuration with score', score, teamConfigurationToString(teamConfiguration))

      if (bestFit.score < score) {
        logger.log('Found New Best Fit with score:', score)
        // logger.debug('New Best Fit Team Configuration:', teamConfigurationToString(teamConfiguration))

        bestFit = {teams: teamConfiguration, score}

        if (bestFit.score === 1) {
          logStats()
          return bestFit.teams
        }
      }

      teamConfigurationsChcked++
      logCount('teamConfigurationsChcked', 1000, teamConfigurationsChcked)
    }
    goalConfigurationsChecked++
    logStats()
  }

  if (!bestFit.teams) {
    throw new Error('Unable to find any valid team configuration for this pool')
  }

  return bestFit.teams
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

export function * getPossibleTeamConfigurations(pool, goalConfiguration, shouldPrune) {
  const playerIds = getPlayerIds(pool)
  const advancedPlayerIds = getAdvancedPlayerIds(pool)
  const teamSizes = goalConfiguration.map(_ => _.teamSize)
  const totalSeats = teamSizes.reduce((sum, next) => sum + next, 0)
  const extraSeats = totalSeats - playerIds.length

  // TODO?? if (extraSeats + advancedPlayerIds !=== teamSizes.length) {
  if (extraSeats === 0 && teamSizes.length > advancedPlayerIds) {
    return
  }

  const totalSteatsByGoal = new Map()
  const teamCountByGoal = new Map()

  goalConfiguration.forEach(({goalDescriptor, teamSize}) => {
    const countedSeatsForGoal = totalSteatsByGoal.get(goalDescriptor) || 0
    totalSteatsByGoal.set(goalDescriptor, countedSeatsForGoal + teamSize)

    const countedTeamsForGoal = teamCountByGoal.get(goalDescriptor) || 0
    teamCountByGoal.set(goalDescriptor, countedTeamsForGoal + 1)
  })

  const nonAdvancedPlayerIds = getNonAdvancedPlayerIds(pool)
  const combinedGoalConfiguration = Array.from(totalSteatsByGoal.entries()).map(([goalDescriptor, teamSize]) => ({goalDescriptor, teamSize}))
  const combinedTeamSizes = combinedGoalConfiguration.map(_ => _.teamSize - teamCountByGoal.get(_.goalDescriptor))

  const duplicateAdvancedPlayerIds = []
  for (let i = 0; i < extraSeats; i++) {
    duplicateAdvancedPlayerIds.push(advancedPlayerIds[i % advancedPlayerIds.length])
  }
  const shouldPrunePartitioning = genShouldPrunePartitioning(shouldPrune, combinedGoalConfiguration, goalConfiguration, {advancedPlayers: false})
  const shouldPruneAdvancedPlayerPartitioning = genShouldPrunePartitioning(shouldPrune, combinedGoalConfiguration, goalConfiguration, {advancedPlayers: true})

  const combinedNonAdvancedPlayerPartitionings = getPossiblePartitionings(nonAdvancedPlayerIds, combinedTeamSizes, shouldPrunePartitioning)
  for (const combinedNonAdvancedPlayerPartitioning of combinedNonAdvancedPlayerPartitionings) {
    // console.log('combinedNonAdvancedPlayerPartitioning', partitioningToString(combinedNonAdvancedPlayerPartitioning))

    const advancedPlayerPartitionings = getPossiblePartitionings(
      advancedPlayerIds.concat(duplicateAdvancedPlayerIds),
      combinedGoalConfiguration.map(({goalDescriptor}) => teamCountByGoal.get(goalDescriptor)),
      shouldPruneAdvancedPlayerPartitioning
    )

    for (const advancedPlayerPartitioning of advancedPlayerPartitionings) {
    console.log('advancedPlayerPartitioning', partitioningToString(advancedPlayerPartitioning))
      const someAdvancedPlayersAreOnMultipleGoals = advancedPlayerIds.some(
        id => playerIsOnMultipleGoals(id, advancedPlayerPartitioning, combinedGoalConfiguration)
      )
      if (someAdvancedPlayersAreOnMultipleGoals) {
        continue
      }

      console.log('Considering Advanced Player Partitioning:', partitioningToString(advancedPlayerPartitioning))

      const advancedPlayerIdsByGoal = getPlayerIdsByGoal(advancedPlayerPartitioning, combinedGoalConfiguration)
      const playerIdsByGoal = getPlayerIdsByGoal(combinedNonAdvancedPlayerPartitioning, combinedGoalConfiguration)

      yield buildTeamConfuguration(goalConfiguration, playerIdsByGoal, advancedPlayerIdsByGoal)
    }
  }
}

function genShouldPrunePartitioning(shouldPruneTeam, combinedGoalConfiguration, goalConfiguration, {advancedPlayers} = {}) {
  return partialPartitioning => {
    if (!shouldPruneTeam) {
      return false
    }
    const playerIdsByGoal = getPlayerIdsByGoal(partialPartitioning, combinedGoalConfiguration)
    const teamConfiguration = buildTeamConfuguration(goalConfiguration, playerIdsByGoal)

    return shouldPruneTeam(teamConfiguration)
  }
}

function buildTeamConfuguration(goalConfiguration, playerIdsByGoal, advancedPlayerIdsByGoal) {
  return goalConfiguration.map(({goalDescriptor, teamSize}) => {
    const playerIds = []

    if (playerIdsByGoal) {
      const unusedIds = playerIdsByGoal[goalDescriptor] || []
      playerIds.push(...unusedIds.splice(0, teamSize - 1))
    }

    if (advancedPlayerIdsByGoal) {
      const unusedIds = advancedPlayerIdsByGoal[goalDescriptor] || []
      if (unusedIds.length > 0) {
        playerIds.push(unusedIds.pop())
      }
    }

    return {goalDescriptor, playerIds}
  })
}

function playerIsOnMultipleGoals(playerId, playerPartitioning, goalConfiguration) {
  let playerGoal
  return playerPartitioning.some((ids, i) => {
    if (ids.includes(playerId)) {
      const thisGoal = goalConfiguration[i].goalDescriptor
      playerGoal = playerGoal || thisGoal
      return thisGoal !== playerGoal
    }
    return false
  })
}

function getPlayerIdsByGoal(playerPartitioning, goalConfiguration) {
  const playerIdsForGoal = {}
  playerPartitioning.forEach((playerIds, i) => {
    const goal = goalConfiguration[i].goalDescriptor
    playerIdsForGoal[goal] = playerIdsForGoal[goal] || []
    playerIdsForGoal[goal].push(...playerIds)
  })
  return playerIdsForGoal
}

export function * getSubsets(list, subsetSize, shouldPrune) {
  const n = list.length
  const k = subsetSize
  const indexesToValues = indexes => indexes.map(i => list[i])
  const shouldPruneByIndexes = subsetIndexes => shouldPrune && shouldPrune(indexesToValues(subsetIndexes))

  for (const subsetIndexes of ennumerateNchooseK(n, k, shouldPruneByIndexes)) {
    yield indexesToValues(subsetIndexes)
  }
}

// Efficient algorithm for getting all the ways to choose some
// number of elements from a list.
//
// From: http://www.cs.colostate.edu/~anderson/cs161/wiki/doku.php?do=export_s5&id=slides:week8
function * ennumerateNchooseK(n, k, shouldPrune, p = 0, low = 0, subset = []) {
  const high = n - 1 - k + p + 1

  for (let i = low; i <= high; i++) {
    subset[p] = i

    if (shouldPrune && shouldPrune(subset)) {
      continue
    }

    if (p >= k - 1) {
      yield subset.concat()
    } else {
      yield * ennumerateNchooseK(n, k, shouldPrune, p + 1, i + 1, subset)
    }
  }
}

//
// Given a list of items and a list of partition sizes, return the
// set of all possible partitionings of the items in the list into
// partitions of the given sizes.
//
export function * getPossiblePartitionings(list, partitionSizes, shouldPrune, depth=0) {
  const [thisPartitionSize, ...otherPartitionSizes] = partitionSizes

  const shouldPruneSubset = subset => {
    if (shouldPrune) {
      const partialPartitioning = range(0, depth).map(() => []).concat([subset])
      return shouldPrune(partialPartitioning)
    }
  }

  for (const subset of getSubsets(list, thisPartitionSize, shouldPruneSubset)) {
    if (otherPartitionSizes.length === 0) {
      yield [subset]
      return
    }
    const newList = list.slice(0)
    subset.forEach(item => {
      newList.splice(newList.indexOf(item), 1)
    })

    for (const partitioning of getPossiblePartitionings(newList, otherPartitionSizes, shouldPrune, depth + 1)) {
      const partialPartitioning = [subset].concat(partitioning)
      if (shouldPrune && shouldPrune(partialPartitioning)) {
        continue
      }
      yield [subset].concat(partitioning)
    }
  }
}

//
// TODO: move to util
//
export function range(start, length) {
  return Array.from(Array(length), (x, i) => i + start)
}

export function choose(n, k) {
  if (k === 0) {
    return 1
  }
  return (n * choose(n - 1, k - 1)) / k
}

//
// TODO: move to helpers/serializers or something
//
export function goalConfigurationToString(goalConfiguration) {
  return goalConfiguration.map(({goalDescriptor, teamSize}) => `${goalDescriptor}:${teamSize}`).join(', ')
}

export function goalConfigurationsToStrings(goalConfigurations) {
  return goalConfigurations.map(goalConfigurationToString)
}

export function teamConfigurationToString(teamConfiguration) {
  return teamConfiguration.map(({goalDescriptor, playerIds}) => `(goal:${goalDescriptor})[${playerIds}]`).join(', ')
}

export function partitioningToString(partitioning) {
  return partitioning.map(partition =>
    `[${partition.sort().join(',')}]`
  ).join(', ')
}

export function partitioningsToStrings(partitionings) {
  return partitionings.map(partitioningToString)
}
