import test from 'ava'

import fields from '../query'
import factory from '../../../../../test/factories'

import {graphql, GraphQLSchema, GraphQLObjectType} from 'graphql'

test.serial('getAllPlayers returns all players', async t => {
  t.plan(1)

  try {
    await factory.createMany('player', 3)
  } catch (e) {
    console.log('error creating player: ', e)
  }

  const query = new GraphQLObjectType({name: 'Query', fields})
  const schema = new GraphQLSchema({query})

  const results = await graphql(schema, '{ getAllPlayers {id} }', {currentUser: true})

  t.is(results.data.getAllPlayers.length, 3)
})
