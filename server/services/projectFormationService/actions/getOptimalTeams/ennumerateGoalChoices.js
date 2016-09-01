import {
  getGoalsWithVotesSortedByPopularity,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
} from '../../pool'

import {range} from '../../util'

// TODO: move to pool
const MIN_TEAM_SIZE = 2

export default function * ennumerateGoalChoices(pool, teamFormationPlan = {}, shouldPrune) {
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

