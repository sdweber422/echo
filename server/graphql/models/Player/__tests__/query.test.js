/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getPlayerById', function () {
    it('returns correct player', async function() {
      const player = await factory.create('player')
      const results = await runGraphQLQuery(
        'query($playerId: ID!) { getPlayerById(id: $playerId) {id chapter { id }} }',
        fields,
        {playerId: player.id}
      )

      expect(results.data.getPlayerById.id).to.equal(player.id)
      expect(results.data.getPlayerById.chapter.id).to.equal(player.chapterId)
    })
    it('behaves correctly when no matching user found')
    it('behaves correctly when user not logged in')
    it('behaves correctly when invalid query sent')
  })

  describe('getAllPlayers', function () {
    it('returns all players', async function() {
      await factory.createMany('player', 3)
      const results = await runGraphQLQuery('{ getAllPlayers {id} }', fields)

      expect(results.data.getAllPlayers.length).to.equal(3)
    })
    it('behaves correctly when no players found')
    it('behaves correctly when user not logged in')
    it('behaves correctly when invalid query sent')
  })
})
