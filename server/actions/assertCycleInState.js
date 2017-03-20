import {getCycleById} from 'src/server/db/cycle'
import {LGBadInputError, LGForbiddenError} from 'src/server/util/error'

export default async function assertCycleInState(cycleIdentifier, state) {
  const cycle = typeof cycleIdentifier === 'string' ? await getCycleById(cycleIdentifier) : cycleIdentifier
  if (!cycle || !cycle.state) {
    throw new LGBadInputError(`Cycle not found for identifier ${cycleIdentifier}`)
  }
  const cycleStates = Array.isArray(state) ? state : [state]
  if (!cycleStates.includes(cycle.state)) {
    throw new LGForbiddenError(`This action is not allowed when the cycle is in the ${cycle.state} state`)
  }
}
