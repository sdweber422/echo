/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {withDBCleanup} from '../../../../../test/helpers/db'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  it('reassignPlayersToChapter updates players', async function() {
    const chapter = await factory.create('chapter')
    const players = await factory.createMany('player', 2)
    const playerIds = players.map(p => p.id)

    const results = await runGraphQLQuery(
      `
        query($playerIds: [ID]!, $chapterId: ID!) {
          reassignPlayersToChapter(playerIds: $playerIds, chapterId: $chapterId) { id }
        }
      `,
      fields,
      {playerIds: players.map(p => p.id), chapterId: chapter.id},
      {currentUser: {roles: ['backoffice']}},
    )

    expect(
      results.data.reassignPlayersToChapter.map(p => p.id).sort()
    ).to.deep.equal(
      playerIds.sort()
    )

    const updatedPlayers = await r.table('players').getAll(...playerIds).run()
    updatedPlayers.forEach(p => {
      expect(p.chapterId).to.equal(chapter.id)
    })
  })

  it('reassignPlayersToChapter - unauthorized users recieve an appropriate error')
  it('reassignPlayersToChapter - invalid queries recieve an appropriate error')
})
