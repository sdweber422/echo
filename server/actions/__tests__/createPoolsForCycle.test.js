/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'
import {resetDB, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import {MAX_POOL_SIZE} from 'src/common/models/pool'
import {Pool, getPlayersInPool} from 'src/server/services/dataService'

import createPoolsForCycle from '../createPoolsForCycle'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('createPoolsForCycle()', function () {
    it('creates pools for each phase that has voting', async function () {
      const cycle = await factory.create('cycle')
      const chapterId = cycle.chapterId

      const votingPhase1 = await factory.create('phase', {number: 3, hasVoting: true})
      const votingPhase2 = await factory.create('phase', {number: 4, hasVoting: true})
      const nonVotingPhase = await factory.create('phase', {number: 1, hasVoting: false})

      const votingPhase1Players = await factory.createMany('player', {chapterId, phaseId: votingPhase1.id}, 2)
      const votingPhase2Players = await factory.createMany('player', {chapterId, phaseId: votingPhase2.id}, 2)
      const nonVotingPhasePlayers = await factory.createMany('player', {chapterId, phaseId: nonVotingPhase.id}, 1)
      const users = ([
        ...votingPhase1Players,
        ...votingPhase2Players,
        ...nonVotingPhasePlayers
      ]).map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(cycle)

      const pools = await Pool.run()

      expect(pools).to.have.lengthOf(2)

      await Promise.each(pools, async pool => {
        const players = await getPlayersInPool(pool.id)
        expect(
          players.every(player => player.phaseId === players[0].phaseId),
          'all players in the pool are in the same phase'
        ).to.be.true
      })
    })

    it('creates even sized pools', async function () {
      const cycle = await factory.create('cycle')
      const chapterId = cycle.chapterId

      const phase = await factory.create('phase', {number: 3, hasVoting: true})

      const phasePlayers = await factory.createMany('player', {chapterId, phaseId: phase.id}, MAX_POOL_SIZE + 1)
      const users = phasePlayers.map(_ => ({id: _.id, active: true}))
      useFixture.nockIDMGetUsersById(users)

      await createPoolsForCycle(cycle)

      const pools = await Pool.run()

      expect(pools).to.have.lengthOf(2)

      await Promise.each(pools, async pool => {
        const players = await getPlayersInPool(pool.id)
        expect(players).to.have.lengthOf((MAX_POOL_SIZE + 1) / 2)
      })
    })
  })
})
