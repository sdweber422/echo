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
  this.timeout(6000)
  beforeEach(resetDB)

  it('moves the player to a pool that includes the given level', async function () {
    const {pools, cycle} = await _createPoolsWithPlayers()
    const currentPool = pools[0]
    const targetPool = pools[1]
    const player = currentPool.players[0]
    const level = targetPool.levels[0]

    expect(currentPool.levels).to.not.include(level)

    const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
    expect(returnedPool.id).to.eq(targetPool.id)

    const playerPoolLinks = await PlayerPool.filter({playerId: player.id}).getJoin({pool: true})
    expect(playerPoolLinks).to.have.lengthOf(1)
    expect(playerPoolLinks[0].pool.id).to.eq(targetPool.id)
  })

  it('changes nothing if level matches', async function () {
    const {pools, cycle} = await _createPoolsWithPlayers()
    const currentPool = pools[0]
    const player = currentPool.players[0]
    const level = currentPool.levels[0]

    const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
    expect(returnedPool.id).to.eq(currentPool.id)

    const playerPoolLinks = await PlayerPool.filter({playerId: player.id}).getJoin({pool: true})
    expect(playerPoolLinks).to.have.lengthOf(1)
    expect(playerPoolLinks[0].pool.id).to.eq(currentPool.id)
  })

  describe('when the target pool is already at max capacity', function () {
    it('splits the target pool', async function () {
      const {pools, cycle} = await _createPoolsWithPlayers({
        poolSizes: [2, MAX_POOL_SIZE],
        poolLevels: [[1], [2]],
        playersHaveVoted: true,
      })
      const currentPool = pools[0]
      const targetPool = pools[1]
      const player = currentPool.players[0]
      const level = targetPool.levels[0]

      const returnedPool = await movePlayerToPoolForLevel(player.id, level, cycle.id)
      const poolSize = await getPoolSize(returnedPool.id)
      expect(poolSize).to.be.lt(MAX_POOL_SIZE)
      expect(returnedPool.id).to.be.eq(targetPool.id)
      expect(await Pool.count().execute()).to.eq(3)

      const voteCountsByPoolId = await _getVoteCountsByPoolId()

      expect(voteCountsByPoolId[targetPool.id]).to.eq(Math.ceil(MAX_POOL_SIZE / 2))
      expect(voteCountsByPoolId[currentPool.id]).to.eq(1)
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

  describe('when the pool being left is now small enough to be combined with an adjacent pool', function () {
    it('combines the pools', async function () {
      const {pools, cycle} = await _createPoolsWithPlayers({
        poolLevels: [[0, 1], [1, 2], [3]],
        poolSizes: [8, 8, 1],
        playersHaveVoted: true,
      })
      const currentPool = pools[0]
      const targetPool = pools[2]
      const player = currentPool.players[0]
      const level = targetPool.levels[0]

      await movePlayerToPoolForLevel(player.id, level, cycle.id)

      const voteCountsByPoolId = await _getVoteCountsByPoolId()

      expect(voteCountsByPoolId[currentPool.id]).to.be.eq(15)
      expect(voteCountsByPoolId[targetPool.id]).to.be.eq(2)

      expect(await Pool.filter({id: pools[1].id})).to.deep.eq([])
      expect(await Pool.get(currentPool.id)).to.have.property('levels').deep.eq([0, 1, 2])
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

function _getVoteCountsByPoolId() {
  return Vote
    .group('poolId')
    .count()
    .ungroup()
    .map(row => r.object(row('group'), row('reduction')))
    .fold(r.object(), (acc, next) => acc.merge(next))
    .execute()
}
