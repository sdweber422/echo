import ObjectiveAppraiser from 'src/server/services/projectFormationService/ObjectiveAppraiser'

import {
  getGoalsWithVotes,
  getTeamSizesByGoal,
  getPoolSize,
  getAdvancedPlayerCount,
} from '../../pool'

import {range} from '../../util'

// TODO: move to pool
const MIN_TEAM_SIZE = 2

export default function * ennumerateGoalChoices(pool, teamFormationPlan = {}, shouldPrune) {
  const teamSizesByGoal = getTeamSizesByGoal(pool)
  const goals = getGoalsWithVotes(pool)

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
  // TODO: this sorting is no longer needed
  .sort((a, b) =>
    a.matchesTeamSizeRecommendation && !b.matchesTeamSizeRecommendation ? 1 :
    b.matchesTeamSizeRecommendation && !a.matchesTeamSizeRecommendation ? -1 : 0
  )

  const optionSizes = goalAndSizeOptions.map(_ => _.teamSize).sort()
  const smallestGoalSizeOption = optionSizes[0]
  const largestGoalSizeOption = optionSizes[optionSizes.length - 1]

  const poolSize = getPoolSize(pool)
  const advancedPlayerCount = getAdvancedPlayerCount(pool)

  const extraSeatScenarios = getValidExtraSeatCountScenarios({
    poolSize,
    smallestGoalSizeOption,
    largestGoalSizeOption,
    advancedPlayerCount,
  })

  const appraiser = new ObjectiveAppraiser(pool)

  yield * _getPossibleGoalConfigurations(teamFormationPlan, {
    goalAndSizeOptions,
    poolSize,
    advancedPlayerCount,
    extraSeatScenarios,
    shouldPrune,
    appraiser,
  })
}

function getValidExtraSeatCountScenarios({poolSize, smallestGoalSizeOption, largestGoalSizeOption, advancedPlayerCount}) {
  // When advanced players are on multiple teams it creates
  // a scenario where we need extra seats on the teams since
  // one player is using multiple seats.
  //
  // Given a certain pool size and smallest/largest possible project sizes
  // there are a limited muber of valid extra seat configurations.
  // This method returns a list of those configurations represented by the
  // number of additional seats.

  const nonAdvancedPlayerCount = poolSize - advancedPlayerCount

  const nonAdvancedSeatsOnLargestGoalSizeOption = largestGoalSizeOption - 1
  const minTeams = Math.floor(nonAdvancedPlayerCount / nonAdvancedSeatsOnLargestGoalSizeOption)
  const minExtraSeats = Math.max(0, minTeams - advancedPlayerCount)

  const nonAdvancedSeatsOnSmallestGoalSizeOption = smallestGoalSizeOption - 1
  const maxTeams = Math.floor(nonAdvancedPlayerCount / nonAdvancedSeatsOnSmallestGoalSizeOption)
  const maxExtraSeats = Math.max(0, maxTeams - advancedPlayerCount)

  return range(minExtraSeats, maxExtraSeats + 1)
}

function * _getPossibleGoalConfigurations(teamFormationPlan, {goalAndSizeOptions, poolSize, advancedPlayerCount, extraSeatScenarios, shouldPrune, appraiser}) {
  const teamOptions = goalAndSizeOptions.map(option => ({playerIds: [], ...option}))
  const nodeStack = teamOptions.map(option => ({
    ...teamFormationPlan,
    seatCount: poolSize,
    teams: [option]
  }))
  .map(teamFormationPlan => ({
    ...teamFormationPlan,
    _score: appraiser.score({...teamFormationPlan})
  }))
  .sort(({_score: a}, {_score: b}) => a - b)

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
      if ((currentSeatCount === (targetSeatCount + extraSeatCount)) && (currentTeams.length === (advancedPlayerCount + extraSeatCount))) {
        yield {...currentNode, seatCount: currentSeatCount}
        continue OUTER
      }
    }

    const newNodes = teamOptions
      .filter(option =>
        extraSeatScenarios.some(extraSeatCount => {
          const newTeamCapacity = currentSeatCount + option.teamSize
          return poolSize + extraSeatCount >= newTeamCapacity
        })
      )
      // Skipping all nodes that are not sorted to ensure that we won't
      // add children that will be duplicates of nodes further left in the tree
      .filter(option => compareGoals(option, currentTeams[currentTeams.length - 1]) >= 0)
      .map(option => ({
        ...currentNode,
        teams: currentTeams.concat(option)
      }))

    // Sort by score so we visit the most promising nodes first.
    const sortedNodes = newNodes
      .map(teamFormationPlan => ({
        ...teamFormationPlan,
        _score: appraiser.score({...teamFormationPlan})
      }))
      .sort(({_score: a}, {_score: b}) => a - b)

    nodeStack.push(...sortedNodes)
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

