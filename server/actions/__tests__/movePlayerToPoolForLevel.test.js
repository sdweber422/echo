/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

import {mapById, groupById, range, sum, repeat, flatten} from 'src/common/util'
import {Vote, PlayerPool, Pool, getPoolSize, r} from 'src/server/services/dataService'
import {MAX_POOL_SIZE} from 'src/common/models/pool'

import movePlayerToPoolForLevel from '../movePlayerToPoolForLevel'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  it('moves the player to a pool that includes the given level', async function () {
    const {pools, cycle} = await _createPoolsWithPlayers()
    const player = pools[0].players[0]
    const level = pools[1].levels[0]
    const currentPool = pools[0]
    const targetPool = pools[1]

    expect(currentPool.levels).to.not.include(level)

    const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
    expect(returnedPool.id).to.eq(targetPool.id)

    const playerPoolLinks = await PlayerPool.filter({playerId: player.id}).getJoin({pool: true})
    expect(playerPoolLinks).to.have.lengthOf(1)
    expect(playerPoolLinks[0].pool.id).to.eq(targetPool.id)
  })

  it('changes nothing if level matches', async function () {
    const {pools, cycle} = await _createPoolsWithPlayers()
    const player = pools[0].players[0]
    const level = pools[0].levels[0]
    const currentPool = pools[0]

    const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
    expect(returnedPool.id).to.eq(currentPool.id)

    const playerPoolLinks = await PlayerPool.filter({playerId: player.id}).getJoin({pool: true})
    expect(playerPoolLinks).to.have.lengthOf(1)
    expect(playerPoolLinks[0].pool.id).to.eq(currentPool.id)
  })

  describe('when the target pool is already at max capacity', function () {
    it('splits the target pool', async function () {
      this.timeout(6000)
      const {pools, cycle} = await _createPoolsWithPlayers({
        poolSizes: [2, MAX_POOL_SIZE],
        poolLevels: [[1], [2]],
        playersHaveVoted: true,
      })
      const player = pools[0].players[0]
      const level = 2
      const currentPool = pools[0]
      const targetPool = pools[1]

      const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
      const poolSize = await getPoolSize(returnedPool.id)
      expect(poolSize).to.be.lt(MAX_POOL_SIZE)
      expect(returnedPool.id).to.be.eq(targetPool.id)
      expect(await Pool.count().execute()).to.eq(3)

      const votesByPoolId = await Vote
        .filter(vote => r.expr(pools.map(_ => _.id)).contains(vote('poolId')))
        .group('poolId')
        .count()
        .ungroup()
        .map(row => r.object(row('group'), row('reduction')))
        .fold(r.object(), (acc, next) => acc.merge(next))
        .execute()

      expect(votesByPoolId[targetPool.id]).to.eq(Math.ceil(MAX_POOL_SIZE / 2))
      expect(votesByPoolId[currentPool.id]).to.eq(1)
    })
  })

  describe('when there are multiple pools for the level', function () {
    it('chooses the smallest pool', async function () {
      const {pools, cycle} = await _createPoolsWithPlayers({
        poolLevels: [[0, 1], [1], [2]],
        poolSizes: [1, 2, 1],
      })
      const player = pools[2].players[0]
      const level = 1
      const targetPool = pools[0]

      const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
      expect(returnedPool.id).to.be.eq(targetPool.id)
    })
  })
})

async function _createPoolsWithPlayers(options = {}) {
  const {
    poolCount = 3,
    poolLevels = range(0, poolCount).map(lvl => [lvl]),
    poolSize = 1,
    poolSizes = repeat(poolCount, poolSize),
    playersHaveVoted = false,
  } = options

  const cycle = await factory.create('cycle')
  const pools = await factory.createMany('pool',
    poolLevels.map(levels => ({levels, cycleId: cycle.id})),
    poolLevels.length
  )

  const players = await factory.createMany('player', sum(poolSizes))
  const playersById = mapById(players)

  const playerIds = [...playersById.keys()]
  const createPlayerLinksForPool = (pool, i) => {
    return factory.createMany('playerPool',
      playerIds.splice(0, poolSizes[i]).map(playerId => ({
        playerId,
        poolId: pool.id
      })),
      poolSizes[i]
    )
  }
  const playerPoolLinks = flatten(await Promise.map(pools, createPlayerLinksForPool))
  const linksByPoolId = groupById(playerPoolLinks, 'poolId')

  const poolsWithPlayers = pools.map(
    pool => Object.assign({}, pool, {
      players: linksByPoolId.get(pool.id).map(({playerId}) => playersById.get(playerId))
    })
  )

  if (playersHaveVoted) {
    await factory.createMany('vote',
      playerPoolLinks.map(({playerId, poolId}) => ({playerId, poolId})),
      playerPoolLinks.length
    )
  }

  return {pools: poolsWithPlayers, cycle}
}
