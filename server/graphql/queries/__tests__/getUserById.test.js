/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  before(function () {
    this.graphQLQuery = 'query($id: ID!) { getUserById(id: $id) {id chapter { id }} }'
  })

  it('returns a player if found', async function () {
    const player = await factory.create('player')
    const results = await runGraphQLQuery(
      this.graphQLQuery,
      fields,
      {id: player.id}
    )
    expect(results.data.getUserById.id).to.equal(player.id)
    expect(results.data.getUserById.chapter.id).to.equal(player.chapterId)
  })

  it('returns a moderator if found', async function () {
    const moderator = await factory.create('moderator')
    const results = await runGraphQLQuery(
      this.graphQLQuery,
      fields,
      {id: moderator.id}
    )
    expect(results.data.getUserById.id).to.equal(moderator.id)
    expect(results.data.getUserById.chapter.id).to.equal(moderator.chapterId)
  })

  it('throws an error if no matching user found', function () {
    const promise = runGraphQLQuery(
      this.graphQLQuery,
      fields,
      {id: 'not.a.real.id'}
    )
    return expect(promise).to.eventually.be.rejectedWith(/no such user/i)
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
