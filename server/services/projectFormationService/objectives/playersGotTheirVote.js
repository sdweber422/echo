import {
  getVotesByPlayerId,
  isAdvancedPlayerId,
  getNonAdvancedPlayerCount,
  getAdvancedPlayerCount,
} from '../pool'

export const SECOND_CHOICE_VALUE = 0.7

export default function playersGotTheirVote(pool, teams, {advancedPlayersOnly, regularPlayersOnly} = {}) {
  const votesByPlayerId = getVotesByPlayerId(pool)

  let playerCount
  let playerIdFilter

  if (regularPlayersOnly) {
    playerCount = getNonAdvancedPlayerCount(pool)
    playerIdFilter = playerId => !isAdvancedPlayerId(pool, playerId)
  } else if (advancedPlayersOnly) {
    playerCount = getAdvancedPlayerCount(pool)
    playerIdFilter = playerId => isAdvancedPlayerId(pool, playerId)
  } else {
    throw new Error('You must specify either regularPlayersOnly or advancedPlayersOnly!')
  }

  const rawScore = teams.reduce((sum, team) => {
    const matchingPlayerIds = team.playerIds.filter(playerIdFilter)
    return sum +
      countPlayersWhoGotTheirVote(0, matchingPlayerIds, team.goalDescriptor, votesByPlayerId) +
      (countPlayersWhoGotTheirVote(1, matchingPlayerIds, team.goalDescriptor, votesByPlayerId) * SECOND_CHOICE_VALUE)
  }, 0)

  return rawScore / playerCount
}

function countPlayersWhoGotTheirVote(voteIndex, playerIds, goalDescriptor, votesByPlayerId) {
  return playerIds.filter(playerId =>
    votesByPlayerId[playerId][voteIndex] === goalDescriptor
  ).length
}
