import r from '../r'
import {customQueryError} from '../util'

export default function getPoolByCycleIdAndPlayerId(cycleId, playerId, {returnNullIfNoneFound = false} = {}) {
  return r.table('pools').filter({cycleId})
    .eqJoin('id', r.table('playersPools'), {index: 'poolId'})
    .filter(row => row('right')('playerId').eq(playerId))
    .merge(row => row('left'))
    .nth(0)
    .default(
      returnNullIfNoneFound ?
        null :
        customQueryError(`This player (${playerId}) was not in any pools this cycle (${cycleId})`)
    )
}
