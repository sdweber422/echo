/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup} from '../../../../../test/helpers/db'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  it('getPlayerById returns correct player', async function() {
    const player = await factory.create('player')
    const results = await runGraphQLQuery(
      'query($playerId: ID!) { getPlayerById(id: $playerId) {id chapter { id }} }',
      fields,
      {playerId: player.id}
    )

    expect(results.data.getPlayerById.id).to.equal(player.id)
    expect(results.data.getPlayerById.chapter.id).to.equal(player.chapterId)
  })
  it('getPlayerById when no matching user found')
  it('getPlayerById when user not logged in')
  it('getPlayerById when invalid query sent')

  it('getAllPlayers returns all players', async function() {
    await factory.createMany('player', 3)
    const results = await runGraphQLQuery('{ getAllPlayers {id} }', fields)

    expect(results.data.getAllPlayers.length).to.equal(3)
  })
  it('getAllPlayers when no players found')
  it('getAllPlayers when user not logged in')
  it('getAllPlayers when invalid query sent')
})
