/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import {GOAL_SELECTION} from 'src/common/models/cycle'
import {range} from 'src/server/util'
import {Pool, getPlayersInPool} from 'src/server/services/dataService'

import createPoolsForCycle from '../createPoolsForCycle'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(async function () {
    useFixture.nockClean()
    this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
    this.createPlayers = count => {
      return factory.createMany('player',
        range(0, count).map(() => ({
          chapterId: this.cycle.chapterId,
        }))
      )
    }
  })

  describe('createPoolsForCycle()', function () {
    it('creates even sized pools', async function () {
      const playerGroup1 = await this.createPlayers(6, 1)
      const playerGroup2 = await this.createPlayers(6, 2)
      const playerGroup3 = await this.createPlayers(6, 4)

      const users = playerGroup1.concat(playerGroup2.concat(playerGroup3)).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(this.cycle)

      const pools = await Pool.filter({cycleId: this.cycle.id})
      expect(pools).to.have.length(2)

      const poolOne = pools.find(pool => pool.name === 'Red')
      const poolTwo = pools.find(pool => pool.name === 'Orange')

      poolOne.players = await getPlayersInPool(poolOne.id)
      poolTwo.players = await getPlayersInPool(poolTwo.id)

      expect(poolOne.players.length).to.eql(9)
      expect(poolTwo.players.length).to.eql(9)
    })
  })
})
