import test from 'ava'

import fields from '../query'
import factory from '../../../../../test/factories'
import {runGraphQLQuery} from '../../../../../test/graphql-helpers'

test.serial('getPlayerById returns correct player', async t => {
  t.plan(2)

  const player = await factory.create('player')
  const results = await runGraphQLQuery(
    'query($playerId: ID!) { getPlayerById(id: $playerId) {id chapter { id }} }',
    fields,
    {playerId: player.id}
  )

  t.is(results.data.getPlayerById.id, player.id)
  t.is(results.data.getPlayerById.chapter.id, player.chapterId)
})

test.serial('getAllPlayers returns all players', async t => {
  t.plan(1)

  await factory.createMany('player', 3)
  const results = await runGraphQLQuery('{ getAllPlayers {id} }', fields)

  t.is(results.data.getAllPlayers.length, 3)
})
