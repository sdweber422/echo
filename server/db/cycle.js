import r from '../../db/connect'

export function findCycles(filter = {}) {
  return r.table('cycles').filter(filter)
}
