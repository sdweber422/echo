import ObjectiveAppraiser from 'src/server/services/projectFormationService/ObjectiveAppraiser'

import {
  getGoalsWithVotes,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
  getMinTeamSize,
} from '../../pool'

import {range, unique} from '../../util'

export default function * ennumerateGoalChoices(pool, teamFormationPlan = {}, shouldPrune, appraiser = new ObjectiveAppraiser(pool)) {
  const goalAndSizeCombinations = getGoalAndSizeCombinations(pool)
  const poolSize = getPoolSize(pool)
  const advancedPlayerCount = getAdvancedPlayerCount(pool)
  const extraSeatScenarios = getValidExtraSeatCountScenarios(pool)

  const teamOptions = goalAndSizeCombinations.map(option => ({playerIds: [], ...option}))
  const nodeStack = teamOptions.map(option => ({
    ...teamFormationPlan,
    seatCount: poolSize,
    teams: [option]
  }))
  sortByScore(nodeStack, appraiser)

  /* eslint-disable no-labels */
  OUTER: for (;;) {
    const currentNode = nodeStack.pop()

    if (!currentNode) {
      return
    }

    if (shouldPrune && shouldPrune(currentNode)) {
      continue
    }
    delete currentNode._score

    const currentTeams = currentNode.teams
    const currentSeatCount = currentTeams.reduce((sum, team) => sum + team.teamSize, 0)
    const targetSeatCount = currentNode.seatCount
    for (const extraSeatCount of extraSeatScenarios) {
      const seatCountAppropriateForExtraSeats = currentSeatCount === (targetSeatCount + extraSeatCount)
      const teamCountAppropriateForExtraSeats = currentTeams.length === (advancedPlayerCount + extraSeatCount)
      if (seatCountAppropriateForExtraSeats && teamCountAppropriateForExtraSeats) {
        yield {...currentNode, seatCount: currentSeatCount}
        continue OUTER
      }
    }

    const teamOptionsNotLargerThanRemainingSpace = teamOptions
      .filter(option =>
        extraSeatScenarios.some(extraSeatCount => {
          const newTeamCapacity = currentSeatCount + option.teamSize
          return poolSize + extraSeatCount >= newTeamCapacity
        })
      )

    const newNodes = teamOptionsNotLargerThanRemainingSpace
      // Skip all nodes that are not sorted to ensure no duplicates
      .filter(option => compareGoals(option, currentTeams[currentTeams.length - 1]) >= 0)
      .map(option => ({
        ...currentNode,
        teams: currentTeams.concat(option)
      }))

    // Sort by score so we visit the most promising nodes first.
    nodeStack.push(...sortByScore(newNodes, appraiser))
  }
}

function sortByScore(teamFormationPlans, appraiser) {
  return teamFormationPlans
    .map(plan => ({...plan, _score: appraiser.score(plan)}))
    .sort((a, b) => a._score - b._score)
}

function getGoalAndSizeCombinations(pool) {
  const teamSizesByGoal = getTeamSizesByGoal(pool)
  const goals = getGoalsWithVotes(pool)
  const minTeamSize = getMinTeamSize(pool)

  return goals.reduce((result, goalDescriptor) => {
    const options = [
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor], matchesTeamSizeRecommendation: true},
      {goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] + 1},
    ]
    if (teamSizesByGoal[goalDescriptor] > minTeamSize) {
      options.push({goalDescriptor, teamSize: teamSizesByGoal[goalDescriptor] - 1})
    }

    return result.concat(options)
  }, [])
}

function getValidExtraSeatCountScenarios(pool) {
  // When advanced players are on multiple teams it creates
  // a scenario where we need extra seats on the teams since
  // one player is using multiple seats.
  //
  // Given a certain pool size and smallest/largest possible project sizes
  // there are a limited muber of valid extra seat configurations.
  // This method returns a list of those configurations represented by the
  // number of additional seats.
  const poolSize = getPoolSize(pool)
  const goalAndSizeCombinations = getGoalAndSizeCombinations(pool)
  const advancedPlayerCount = getAdvancedPlayerCount(pool)
  const nonAdvancedPlayerCount = poolSize - advancedPlayerCount

  const sizeOptions = unique(goalAndSizeCombinations.map(_ => _.teamSize)).sort()
  const smallestGoalSizeOption = sizeOptions[0]
  const largestGoalSizeOption = sizeOptions[sizeOptions.length - 1]

  const nonAdvancedSeatsOnLargestGoalSizeOption = largestGoalSizeOption - 1
  const minTeams = Math.floor(nonAdvancedPlayerCount / nonAdvancedSeatsOnLargestGoalSizeOption)
  const minExtraSeats = Math.max(0, minTeams - advancedPlayerCount)

  const nonAdvancedSeatsOnSmallestGoalSizeOption = smallestGoalSizeOption - 1
  const maxTeams = Math.floor(nonAdvancedPlayerCount / nonAdvancedSeatsOnSmallestGoalSizeOption)
  const maxExtraSeats = Math.max(0, maxTeams - advancedPlayerCount)

  return range(minExtraSeats, maxExtraSeats + 1)
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

