export default function eachTeamHasAnAdvancedPlayer(pool, teams) {
  const teamsWithAdvancedPlayers = teams.filter(team =>
    team.playerIds.some(playerId =>
      pool.advancedPlayers.includes(playerId)
    )
  )
  return teamsWithAdvancedPlayers.length / teams.length
}
