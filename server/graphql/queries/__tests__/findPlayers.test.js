/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  before(function () {
    this.graphQLQuery = 'query { findPlayers {id} }'
  })

  it('returns all players', async function () {
    await factory.createMany('player', 3)
    const results = await runGraphQLQuery(
      this.graphQLQuery,
      fields
    )
    expect(results.data.findPlayers.length).to.equal(3)
  })

  it('returns an empty array if there are no players', async function () {
    const results = await runGraphQLQuery(
      this.graphQLQuery,
      fields
    )
    expect(results.data.findPlayers.length).to.equal(0)
  })

  it('throws an error if user is not signed-in', function () {
    const promise = runGraphQLQuery(
      this.graphQLQuery,
      fields,
      {id: 'not.a.real.id'},
      {currentUser: null}
    )
    return expect(promise).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
