import {getAdvancedPlayerInfo} from '../pool'

export default class AdvancedPlayersTeamCountDoesNotExceedMaxObjective {
  constructor(pool) {
    this.advancedPlayerInfo = getAdvancedPlayerInfo(pool)
    this.advancedPlayerCount = this.advancedPlayerInfo.length
  }

  score(teamFormationPlan) {
    const advancedPlayerIds = []
    const maxTeamsByPlayer = {}
    const projectCountByAdvancedPlayer = {}

    this.advancedPlayerInfo.forEach(({id, maxTeams}) => {
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

    return numAdvancedPlayersWithGoodProjectCount / this.advancedPlayerCount
  }
}
