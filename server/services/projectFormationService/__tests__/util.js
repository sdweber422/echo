import {range} from 'src/server/services/projectFormationService/util'

export function buildTestPool({playerCount, advancedPlayerCount, goalCount, teamSize}) {
  teamSize = teamSize || 4
  const goals = range(0, goalCount).map(i => ({
    goalDescriptor: `g${i}`,
    teamSize,
  }))
  const playerInfoToVote = (playerInfo, i) => ({
    playerId: playerInfo.id,
    votes: [goals[i % goals.length].goalDescriptor, goals[(i + 1) % goals.length].goalDescriptor],
  })
  const advancedPlayers = range(0, advancedPlayerCount).map(i => ({id: `A${i}`}))
  const nonAdvancedPlayerIds = range(0, playerCount).map(i => ({id: `p${i}`}))
  const advancedPlayerVotes = advancedPlayers.map(playerInfoToVote)
  const nonAdvancedPlayerVotes = nonAdvancedPlayerIds.map(playerInfoToVote)

  const votes = advancedPlayerVotes.concat(nonAdvancedPlayerVotes)

  return {votes, goals, advancedPlayers}
}

