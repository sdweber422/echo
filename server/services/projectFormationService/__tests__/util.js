import {range, flatten, repeat} from 'src/server/services/projectFormationService/util'

// TODO: rename to testHelpers.js
export function buildTestPool({playerCount, advancedPlayerCount, goalCount, teamSize, voteDistributionPercentages}) {
  teamSize = teamSize || 4
  const goals = range(0, goalCount).map(i => ({
    goalDescriptor: `g${i}`,
    teamSize,
  }))
  const voteDistribution = buildVoteDistribution(playerCount + advancedPlayerCount, goals, voteDistributionPercentages)
  const advancedPlayers = range(0, advancedPlayerCount).map(i => ({id: `A${i}`, maxTeams: 3}))
  const nonAdvancedPlayers = range(0, playerCount).map(i => ({id: `p${i}`}))
  const players = nonAdvancedPlayers.concat(advancedPlayers)

  const votes = players.map((playerInfo, i) => ({
    playerId: playerInfo.id,
    votes: voteDistribution[i],
  }))

  return {votes, goals, advancedPlayers}
}

function buildVoteDistribution(voteCount, goals, percentages = [0.2, 0.2, 0.1]) {
  const distinctGoalCount = goals.length
  const goalDescriptors = goals.map(_ => _.goalDescriptor)
  const voteDistribution = goalDescriptors.reduce((result, goalDescriptor, i) => {
    const percentOfVotes = percentages[i] || 0
    const goalProbability = Math.floor(voteCount * percentOfVotes)

    return result.concat(
      repeat(
        Math.max(1, goalProbability),
        [goalDescriptor, goalDescriptors[(i + 1) % distinctGoalCount]]
      )
    )
  }, [])

  const votesLeft = voteCount - voteDistribution.length
  const fillerVotes = flatten(repeat(Math.ceil(votesLeft / distinctGoalCount), goalDescriptors))
    .map((goalDescriptor, i) => [goalDescriptor, goalDescriptors[(i + 1) % distinctGoalCount]])

  return voteDistribution.concat(fillerVotes.reverse().slice(0, votesLeft))
}
