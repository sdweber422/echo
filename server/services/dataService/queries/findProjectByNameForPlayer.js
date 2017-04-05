import r from '../r'
import {customQueryError} from '../util'

export default function findProjectByNameForPlayer(name, playerId) {
  const filter = project => r.and(
    project('name').eq(name),
    project('playerIds').contains(playerId)
  )
  return r.table('projects').filter(filter)
    .nth(0)
    .default(customQueryError(`Project ${name} not found`))
}
