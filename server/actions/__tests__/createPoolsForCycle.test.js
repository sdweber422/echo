/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {withDBCleanup, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import {GOAL_SELECTION} from 'src/common/models/cycle'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {range} from 'src/server/util'
import {findPoolsByCycleId, getPlayersInPool} from 'src/server/db/pool'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(async function () {
    useFixture.nockClean()
    this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
    this.createPlayersInLevel = (count, level) => {
      return factory.createMany('player',
        range(0, count).map(() => ({
          chapterId: this.cycle.chapterId,
          stats: {
            [STAT_DESCRIPTORS.LEVEL]: level,
            [STAT_DESCRIPTORS.ELO]: {
              rating: Math.random() * 100
            },
            [STAT_DESCRIPTORS.EXPERIENCE_POINTS]: Math.random() * 100
          },
        }))
      )
    }
  })

  describe('createPoolsForCycle()', function () {
    it('creates even sized pools sorted by level, then elo, then xp', async function () {
      const lvl1Players = await this.createPlayersInLevel(6, 1)
      const lvl2Players = await this.createPlayersInLevel(6, 2)
      const lvl4Players = await this.createPlayersInLevel(6, 4)

      const users = lvl1Players.concat(lvl2Players.concat(lvl4Players)).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(this.cycle)

      const pools = await findPoolsByCycleId(this.cycle.id)
      expect(pools).to.have.length(2)

      const poolOne = pools.find(pool => pool.name === 'Red')
      const poolTwo = pools.find(pool => pool.name === 'Orange')

      poolOne.players = await getPlayersInPool(poolOne.id)
      poolTwo.players = await getPlayersInPool(poolTwo.id)

      const highestLevelTwoEloInPoolOne = Math.max(
        ...poolOne.players.filter(player => player.stats.level === 2)
          .map(player => player.stats.elo.rating)
      )
      const lowestLevelTwoEloInPoolTwo = Math.min(
        ...poolTwo.players.filter(player => player.stats.level === 2)
          .map(player => player.stats.elo.rating)
      )

      expect(poolOne.players.length).to.eql(9)
      expect(poolTwo.players.length).to.eql(9)
      expect(poolOne.players.filter(player => player.stats.level === 4)).to.eql([])
      expect(poolTwo.players.filter(player => player.stats.level === 1)).to.eql([])
      expect(lowestLevelTwoEloInPoolTwo >= highestLevelTwoEloInPoolOne).to.eql(true)
    })
  })
})
