/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  withDBCleanup()

  before(function () {
    this.graphQLQuery = 'query($id: ID!) { getPlayerById(id: $id) {id chapter { id }} }'
  })

  it('returns correct player', async function () {
    const player = await factory.create('player')
    const results = await runGraphQLQuery(
      this.graphQLQuery,
      fields,
      {id: player.id}
    )
    expect(results.data.getPlayerById.id).to.equal(player.id)
    expect(results.data.getPlayerById.chapter.id).to.equal(player.chapterId)
  })

  it('throws an error if no matching user found', function () {
    const promise = runGraphQLQuery(
      this.graphQLQuery,
      fields,
      {id: 'not.a.real.id'}
    )
    return expect(promise).to.eventually.be.rejectedWith(/no such player/i)
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
