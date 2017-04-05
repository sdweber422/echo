import r from '../r'

export default function getPlayersInPool(poolId) {
  return r.table('playersPools').filter({poolId})
    .eqJoin('playerId', r.table('players'))
    .map(join => join('right'))
}
