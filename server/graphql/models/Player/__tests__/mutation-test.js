import test from 'ava'

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

test.serial('reassignPlayersToChapter updates players', async t => {
  t.plan(3)

  const chapter = await factory.create('chapter')
  const players = await factory.createMany('player', 2)
  const playerIds = players.map(p => p.id)

  const results = await runGraphQLQuery(
    `{ reassignPlayersToChapter(
        playerIds: ["${playerIds[0]}", "${playerIds[1]}"],
        chapterId: "${chapter.id}"
      )
     { id } }`,
    fields,
    {currentUser: {roles: ['backoffice']}},
  )

  t.deepEqual(
    results.data.reassignPlayersToChapter.map(p => p.id).sort(),
    playerIds.sort(),
  )

  const updatedPlayers = await r.table('players').getAll(...playerIds).run()
  updatedPlayers.forEach(p => {
    t.is(p.chapterId, chapter.id)
  })
})
