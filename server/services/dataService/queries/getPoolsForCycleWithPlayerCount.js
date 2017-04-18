import r from '../r'

export default function getPoolsForCycleWithPlayerCount(cycleId) {
  return r.table('pools').getAll(cycleId, {index: 'cycleId'})
    .map(pool => pool.merge({
      count: r.table('playersPools').getAll(pool('id'), {index: 'poolId'}).count()
    }))
}
