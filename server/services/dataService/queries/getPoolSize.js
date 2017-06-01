import r from '../r'

export default function getPoolSize(poolId) {
  return r.table('playersPools').filter({poolId}).count()
}
