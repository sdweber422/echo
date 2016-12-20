import {GraphQLError} from 'graphql/error'

import {getCycleById} from 'src/server/db/cycle'

export default async function assertCycleInState(cycleIdentifier, state) {
  const cycle = typeof cycleIdentifier === 'string' ? await getCycleById(cycleIdentifier) : cycleIdentifier
  if (!cycle || !cycle.state) {
    throw new GraphQLError(`Cycle not found for identifier ${cycleIdentifier}`)
  }
  const cycleStates = Array.isArray(state) ? state : [state]
  if (!cycleStates.includes(cycle.state)) {
    throw new GraphQLError(`This action is not allowed when the cycle is in the ${cycle.state} state`)
  }
}
