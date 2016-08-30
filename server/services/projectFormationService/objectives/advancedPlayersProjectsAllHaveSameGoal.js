import {getAdvancedPlayerIds, isAdvancedPlayerId} from '../pool'

export default function advancedPlayersProjectsAllHaveSameGoal(pool, teamFormationPlan) {
  const advancedPlayerIds = getAdvancedPlayerIds(pool)
  const advancedPlayerCount = advancedPlayerIds.length

  const goalsByAdvancedPlayer = advancedPlayerIds.reduce(
    (result, id) => ({...result, [id]: new Set()}),
    {}
  )

  const goalsWithAdvancedPlayers = new Set()
  const selectedGoals = new Set()
  teamFormationPlan.teams.forEach(team => {
    selectedGoals.add(team.goalDescriptor)
    team.playerIds
      .filter(id => isAdvancedPlayerId(pool, id))
      .forEach(id => {
        goalsWithAdvancedPlayers.add(team.goalDescriptor)
        goalsByAdvancedPlayer[id].add(team.goalDescriptor)
      })
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

  const numGoalsWithNoAdvancedPlayer = selectedGoals.size - goalsWithAdvancedPlayers.size
  const numUnassignedAdvancedPlayers = advancedPlayerCount - numAdvancedPlayersAssignedToTeams
  const extraGoals = Math.max(0, numGoalsWithNoAdvancedPlayer - numUnassignedAdvancedPlayers)

  return (numAdvancedPlayersWithOneGoal + numAdvancedPlayersRemaining - extraGoals) / advancedPlayerCount
}
