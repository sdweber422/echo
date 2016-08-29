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
    logger.log('Goal Configurations Checked:', goalConfigurationsChecked,
      'Branches Pruned:', branchesPruned,
      'Team Configurations Chcked:', teamConfigurationsChcked,
      'Nodes Traversed', nodesTraversed,
      'Best Fit Score', bestFit.score,
      'Best Fit', bestFit.teams ? humanizeTeamFormationPlan(bestFit) : '-none-',
    )
  }

  const shouldPrune = teamFormationPlan => {
    logCount('nodesTraversed', 10000, nodesTraversed++)
    const score = scoreOnObjectives(pool, teamFormationPlan, {teamsAreIncomplete: true})
    const prune = score < bestFit.score
    // console.log(`PRUNE? [${prune ? '-' : '+'}]`, humanizeTeamFormationPlan(teamFormationPlan), score)
    if (prune) {
      branchesPruned++
      logCount('branchesPruned', 10000, branchesPruned)
    }
    return prune
  }

  const root = {}

  for (const teamFormationPlan of ennumerateGoalChoices(pool, root)) {
    logger.log('Checking Goal Configuration: [', humanizeTeamFormationPlan(teamFormationPlan), ']')

    for (const teamFormationPlan of ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
      const score = scoreOnObjectives(pool, teamFormationPlan)
      logger.trace('Checking Player Assignment Configuration: [', humanizeTeamFormationPlan(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        logger.log('Found New Best Fit with score:', score)
        logStats()

        bestFit = {...teamFormationPlan, score}

        if (bestFit.score === 1) {
          logStats()
          return bestFit.teams
        }
      }

      teamConfigurationsChcked++
    }
    goalConfigurationsChecked++
    logStats()
  }

  if (!bestFit.teams) {
    throw new Error('Unable to find any valid team configuration for this pool')
  }

  return bestFit.teams
}

export function * ennumerateGoalChoices(pool, teamFormationPlan = {}) {
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
    const goalConfigurations = _getPossibleGoalConfigurations({
      goalAndSizeOptions,
      smallestGoalSizeOption,
      seatCount: poolSize + extraSeats,
      teamCount: extraSeats + advancedPlayerCount,
    })
    for (const goalConfig of goalConfigurations) {
      yield {...teamFormationPlan, teams: goalConfig}
    }
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

export function * ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const advancedPlayerAssignmentChoices = ennumerateAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  for (const teamFormationPlan of advancedPlayerAssignmentChoices) {
    logger.debug('Checking Advanced Player Assignment Choice: [', humanizeTeamFormationPlan(teamFormationPlan), ']')
    yield * ennumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  }
}

function * ennumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune) {
  const nonAdvancedPlayerIds = getNonAdvancedPlayerIds(pool)
  yield * ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, shouldPrune, nonAdvancedPlayerIds)
}

function * ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, shouldPrune, unassignedPlayerIds, ap = false) {
  console.log('ennumeratePlayerAssignmentChoicesFromList called ap =', ap)

  const playerIds = getPlayerIds(pool)
  const goalConfiguration = teamFormationPlan.teams

  const totalSeatsByGoal = new Map()
  goalConfiguration.forEach(({goalDescriptor, teamSize}) => {
    const countedSeatsForGoal = totalSeatsByGoal.get(goalDescriptor) || 0
    totalSeatsByGoal.set(goalDescriptor, countedSeatsForGoal + (ap ? 1 : teamSize - 1))
  })

  const combinedGoalConfiguration = Array.from(totalSeatsByGoal.entries()).map(([goalDescriptor, teamSize]) => ({goalDescriptor, teamSize}))
  const playerPartitionings = getPossiblePartitionings(
    unassignedPlayerIds,
    combinedGoalConfiguration.map(_ => _.teamSize),
    genShouldPrunePartitioning(shouldPrune, teamFormationPlan, combinedGoalConfiguration, goalConfiguration),
  )

  for (const playerPartitioning of playerPartitionings) {
    // TODO: make this an objective
    const somePlayersAreOnMultipleGoals = playerIds.some(
      id => playerIsOnMultipleGoals(id, playerPartitioning, combinedGoalConfiguration)
    )
    if (somePlayersAreOnMultipleGoals) {
      continue
    }

    const playerIdsByGoal = getPlayerIdsByGoal(playerPartitioning, combinedGoalConfiguration)
    const newPlayerIds = ap ?
      buildTeamConfuguration(goalConfiguration, {}, playerIdsByGoal) :
      buildTeamConfuguration(goalConfiguration, playerIdsByGoal)

    const teams = teamFormationPlan.teams.map((team, i) => {
      const currentPlayerIds = team.playerIds || []
      const playerIds = currentPlayerIds.concat(newPlayerIds[i].playerIds)
      return {...team, playerIds}
    })

    yield {...teamFormationPlan, teams}
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
  return ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, shouldPrune, playerIdList, true)
}

function genShouldPrunePartitioning(shouldPrunePlan, teamFormationPlan, combinedGoalConfiguration, goalConfiguration) {
  return partialPartitioning => {
    if (!shouldPrunePlan) {
      return false
    }
    const playerIdsByGoal = getPlayerIdsByGoal(partialPartitioning, combinedGoalConfiguration)
    const teams = buildTeamConfuguration(goalConfiguration, playerIdsByGoal)

    return shouldPrunePlan({
      ...teamFormationPlan,
      teams: teamFormationPlan.teams.map((team, i) => ({
        ...team,
        ...teams[i],
        playerIds: (team.playerIds || []).concat(teams[i].playerIds),
      }))
    })
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
export function * getPossiblePartitionings(list, partitionSizes, shouldPrunePartitioning, acc = []) {
  const [thisPartitionSize, ...otherPartitionSizes] = partitionSizes

  const shouldPruneSubset = subset => {
    if (shouldPrunePartitioning) {
      const partialPartitioning = acc.concat([subset])
      return shouldPrunePartitioning(partialPartitioning)
    }
  }

  if (!thisPartitionSize) {
    yield acc
    return
  }

  for (const subset of getSubsets(list, thisPartitionSize, shouldPruneSubset)) {
    const newList = list.slice(0)
    subset.forEach(item => {
      newList.splice(newList.indexOf(item), 1)
    })

    for (const partitioning of getPossiblePartitionings(newList, otherPartitionSizes, shouldPrunePartitioning, acc.concat([subset]))) {
      if (shouldPrunePartitioning && shouldPrunePartitioning(partitioning)) {
        continue
      }
      yield partitioning
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
export function humanizeTeamFormationPlan(plan) {
  return teamConfigurationToString(plan.teams)
}

export function goalConfigurationToString(goalConfiguration) {
  return goalConfiguration.map(({goalDescriptor, teamSize}) => `${goalDescriptor}:${teamSize}`).join(', ')
}

export function goalConfigurationsToStrings(goalConfigurations) {
  return goalConfigurations.map(goalConfigurationToString)
}

export function teamConfigurationToString(teamConfiguration) {
  return teamConfiguration.map(({goalDescriptor, teamSize, playerIds}) => `(${goalDescriptor}:${teamSize})[${playerIds ? playerIds : ''}]`).join(', ')
}

export function partitioningToString(partitioning) {
  return partitioning.map(partition =>
    `[${partition.sort().join(',')}]`
  ).join(', ')
}

export function partitioningsToStrings(partitionings) {
  return partitionings.map(partitioningToString)
}
