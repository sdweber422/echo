import {flatten, unique} from 'src/server/services/projectFormationService/util'

export function teamFormationPlanToString(plan) {
  return plan.teams.map(({goalDescriptor, teamSize, playerIds}) =>
    `(${goalDescriptor}:${teamSize})[${playerIds || ''}]`
  ).join(', ')
}

export function getAssignedPlayerIds(teamFormationPlan) {
  return unique(flatten(
    teamFormationPlan.teams.map(({playerIds}) => playerIds)
  ))
}
