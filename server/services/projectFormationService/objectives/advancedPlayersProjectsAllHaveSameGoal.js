import {getAdvancedPlayerIds} from '../pool'

export default function advancedPlayersProjectsAllHaveSameGoal(pool, teams) {
  const advancedPlayerIds = getAdvancedPlayerIds(pool)
  const advancedPlayerCount = advancedPlayerIds.length

  const goalsByAdvancedPlayer = advancedPlayerIds.reduce(
    (result, id) => ({...result, [id]: new Set()}),
    {}
  )

  teams.forEach(team => {
    team.playerIds.forEach(
      id => {
        if (advancedPlayerIds.includes(id)) {
          goalsByAdvancedPlayer[id].add(team.goalDescriptor)
        }
      }
    )
  })

  let numAdvancedPlayersAssignedToTeams = 0
  let numAdvancedPlayersWithOneGoal = 0
  Object.keys(goalsByAdvancedPlayer).forEach(id => {
    if (goalsByAdvancedPlayer[id].size > 0) {
      numAdvancedPlayersAssignedToTeams++
    }
    if (goalsByAdvancedPlayer[id].size === 1) {
      numAdvancedPlayersWithOneGoal++
    }
  })
  const numAdvancedPlayersRemaining = advancedPlayerCount - numAdvancedPlayersAssignedToTeams

  return (numAdvancedPlayersWithOneGoal + numAdvancedPlayersRemaining) / advancedPlayerCount
}

