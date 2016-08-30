import {scoreOnObjectives} from '../objectives'

import logger from '../logger'

import {
  range,
  shuffle,
} from '../util'

import {
  getGoalsWithVotesSortedByPopularity,
  getPlayerIds,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
  getAdvancedPlayerIds,
  getNonAdvancedPlayerIds,
  getVotesByPlayerId,
} from '../pool'

const MIN_TEAM_SIZE = 2

export default function getOptimalTeams(pool) {
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0
  let branchesPruned = 0
  let pruneCalled = 0

  const logStats = (prefix = '') => {
    logger.log(
      prefix,
      'Goal Configurations Checked:', goalConfigurationsChecked,
      'Branches Pruned:', branchesPruned, '/', pruneCalled,
      'Team Configurations Chcked:', teamConfigurationsChcked,
      'Best Fit:', bestFit.teams ? teamFormationPlanToString(bestFit) : '-none-',
      'Best Fit Score:', bestFit.score,
    )
  }
  const logCount = (name, interval, count) => count % interval || logger.debug('>>>>>>>COUNT ', name, count)

  const shouldPrune = teamFormationPlan => {
    logCount('pruneCalled', 10000, pruneCalled++)
    const score = scoreOnObjectives(pool, teamFormationPlan, {teamsAreIncomplete: true})
    const prune = score < bestFit.score
    logger.trace(`PRUNE? [${prune ? '-' : '+'}]`, teamFormationPlanToString(teamFormationPlan), score)
    if (prune) {
      branchesPruned++
      logCount('branchesPruned', 10000, branchesPruned)
    }
    return prune
  }

  const rootTeamFormationPlan = {teams: []}
  for (const teamFormationPlan of ennumerateGoalChoices(pool, rootTeamFormationPlan, shouldPrune)) {
    logger.debug('Checking Goal Configuration: [', teamFormationPlanToString(teamFormationPlan), ']')

    for (const teamFormationPlan of ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
      const score = scoreOnObjectives(pool, teamFormationPlan)
      logger.debug('Checking Player Assignment Configuration: [', teamFormationPlanToString(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        bestFit = {...teamFormationPlan, score}

        logStats('Found New Best Fit -')

        if (bestFit.score === 1) {
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

export function * ennumerateGoalChoices(pool, teamFormationPlan = {}, shouldPrune) {
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
  .sort((a, b) =>
    a.matchesTeamSizeRecommendation && !b.matchesTeamSizeRecommendation ? 1 :
    b.matchesTeamSizeRecommendation && !a.matchesTeamSizeRecommendation ? -1 : 0
  )

  const smallestGoalSizeOption = goalAndSizeOptions
    .map(_ => _.teamSize)
    .reduce((bestSoFar, current) => current < bestSoFar ? current : bestSoFar)

  const poolSize = getPoolSize(pool)
  const advancedPlayerCount = getAdvancedPlayerCount(pool)

  const extraSeatScenarios = getValidExtraSeatCountScenarios({
    poolSize,
    smallestGoalSizeOption,
    advancedPlayerCount,
  })

  yield * _getPossibleGoalConfigurations(teamFormationPlan, {
    goalAndSizeOptions,
    poolSize,
    advancedPlayerCount,
    extraSeatScenarios,
    shouldPrune,
  })
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

  const maxTeams = Math.floor(poolSize / MIN_TEAM_SIZE)
  const maxExtraSeats = maxTeams - advancedPlayerCount

  return range(minExtraSeats, maxExtraSeats).filter(extraSeats => {
    // We can further filter the list of valid scenarios by only
    // considering cases where the seatCount can accomodate the
    // number of teams implied by the number of extra seats.
    const teamCount = extraSeats + advancedPlayerCount
    const seatCount = poolSize + extraSeats
    return teamCount * smallestGoalSizeOption <= seatCount
  })
}

function * _getPossibleGoalConfigurations(teamFormationPlan, {goalAndSizeOptions, poolSize, advancedPlayerCount, extraSeatScenarios, shouldPrune}) {
  const teamOptions = goalAndSizeOptions.map(option => ({playerIds: [], ...option}))
  const nodeStack = teamOptions.map(option => ({
    ...teamFormationPlan,
    seatCount: option.teamSize,
    teams: [option]
  }))

  for (;;) {
    const currentNode = nodeStack.pop()

    if (!currentNode) {
      return
    }

    if (shouldPrune && shouldPrune(currentNode)) {
      continue
    }

    const currentTeams = currentNode.teams
    for (const extraSeatCount of extraSeatScenarios) {
      if ((currentNode.seatCount === (poolSize + extraSeatCount)) && (currentTeams.length === (advancedPlayerCount + extraSeatCount))) {
        yield currentNode
      }
    }

    nodeStack.push(...teamOptions
      .filter(option =>
        extraSeatScenarios.some(extraSeatCount => {
          const newTeamCapacity = currentNode.seatCount + option.teamSize
          return poolSize + extraSeatCount >= newTeamCapacity
        })
      )
      // Skipping all nodes that are not sorted to ensure that we won't
      // add children that will be duplicates of nodes further left in the tree
      .filter(option => compareGoals(option, currentTeams[currentTeams.length - 1]) >= 0)
      .map(option => ({
        ...currentNode,
        seatCount: currentNode.seatCount + option.teamSize,
        teams: currentTeams.concat(option)
      }))
    )
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
    logger.debug('Checking Advanced Player Assignment Choice: [', teamFormationPlanToString(teamFormationPlan), ']')
    yield * ennumerateNonAdvancedPlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)
  }
}

function * ennumerateRandomHeuristicPlayerAssignents(pool, teamFormationPlan, playerIdsToAssign, shouldPrune, count = 50) {
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
      return null
    }).filter(_ => _ !== undefined)
    return {...team, playerIds: team.playerIds.concat(newPlayerIds)}
  })

  teamsWithPlayers = teamsWithPlayers.map(team => {
    const newPlayerIds = votes.splice(0, team.teamSize - team.playerIds.length).map(_ => _.playerId)
    return {...team, playerIds: team.playerIds.concat(newPlayerIds)}
  })

  return {...teamFormationPlan, teams: teamsWithPlayers}
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
  yield * ennumerateRandomHeuristicPlayerAssignents(pool, teamFormationPlan, nonAdvancedPlayerIds, shouldPrune)
  // yield * ennumeratePlayerAssignmentChoicesFromList(pool, teamFormationPlan, nonAdvancedPlayerIds, shouldPrune)
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

    yield * getPossiblePartitionings(newList, otherPartitionSizes, shouldPrunePartitioning, acc.concat([subset]))
  }
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

export function teamFormationPlanToString(plan) {
  return plan.teams.map(({goalDescriptor, teamSize, playerIds}) => `(${goalDescriptor}:${teamSize})[${playerIds ? playerIds : ''}]`).join(', ')
}
