import {getAdvancedPlayerInfo} from '../pool'

export default class AdvancedPlayersTeamCountDoesNotExceedMaxObjective {
  constructor(pool) {
    this.advancedPlayerInfo = getAdvancedPlayerInfo(pool)
    this.advancedPlayerCount = this.advancedPlayerInfo.length
    this.advancedPlayerIdSet = new Set()
    this.maxTeamsByPlayer = {}

    this.advancedPlayerInfo.forEach(({id, maxTeams}) => {
      this.advancedPlayerIdSet.add(id)
      this.maxTeamsByPlayer[id] = maxTeams || 10
    })
  }

  score(teamFormationPlan) {
    const projectCountByAdvancedPlayer = {}

    teamFormationPlan.teams.forEach(team => {
      team.playerIds.forEach(
        id => {
          if (this.advancedPlayerIdSet.has(id)) {
            projectCountByAdvancedPlayer[id] = (projectCountByAdvancedPlayer[id] || 0) + 1
          }
        }
      )
    })

    let numAdvancedPlayersWithGoodProjectCount = 0
    this.advancedPlayerInfo.forEach(({id}) => {
      const projectCount = projectCountByAdvancedPlayer[id] || 0
      if (projectCount <= this.maxTeamsByPlayer[id]) {
        numAdvancedPlayersWithGoodProjectCount++
      }
    })

    return numAdvancedPlayersWithGoodProjectCount / this.advancedPlayerCount
  }
}
