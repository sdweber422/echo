import {getAdvancedPlayerInfo} from '../pool'

export default function advancedPlayersTeamCountDoesNotExceedMax(pool, teamFormationPlan) {
  const advancedPlayerInfo = getAdvancedPlayerInfo(pool)
  const advancedPlayerCount = advancedPlayerInfo.length

  const advancedPlayerIds = []
  const maxTeamsByPlayer = {}
  const projectCountByAdvancedPlayer = {}

  advancedPlayerInfo.forEach(({id, maxTeams}) => {
    advancedPlayerIds.push(id)
    maxTeamsByPlayer[id] = maxTeams || 10
    projectCountByAdvancedPlayer[id] = 0
  })

  teamFormationPlan.teams.forEach(team => {
    team.playerIds.forEach(
      id => {
        if (advancedPlayerIds.includes(id)) {
          projectCountByAdvancedPlayer[id]++
        }
      }
    )
  })

  let numAdvancedPlayersWithGoodProjectCount = 0
  Object.keys(projectCountByAdvancedPlayer).forEach(id => {
    if (projectCountByAdvancedPlayer[id] <= maxTeamsByPlayer[id]) {
      numAdvancedPlayersWithGoodProjectCount++
    }
  })

  return numAdvancedPlayersWithGoodProjectCount / advancedPlayerCount
}
