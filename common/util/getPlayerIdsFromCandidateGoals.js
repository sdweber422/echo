export default function getPlayerIdsFromCandidateGoals(candidateGoals) {
  const playerIds = candidateGoals ? Array.from(
    candidateGoals.reduce((playerIdSet, candidateGoal) => {
      const newPlayerIds = Array.from(
        candidateGoal.playerGoalRanks.reduce((newPlayerIdSet, rank) => {
          newPlayerIdSet.add(rank.playerId)
          return newPlayerIdSet
        }, new Set())
      )
      newPlayerIds.forEach(playerId => playerIdSet.add(playerId))
      return playerIdSet
    }, new Set())
  ) : []
  return playerIds
}
