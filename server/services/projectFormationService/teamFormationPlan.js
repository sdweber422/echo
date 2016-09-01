export function teamFormationPlanToString(plan) {
  return plan.teams.map(({goalDescriptor, teamSize, playerIds}) =>
    `(${goalDescriptor}:${teamSize})[${playerIds || ''}]`
  ).join(', ')
}
