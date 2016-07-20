/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getPlayerById', function () {
    before(function () {
      this.graphQLQuery = 'query($id: ID!) { getPlayerById(id: $id) {id chapter { id }} }'
    })

    it('returns correct player', async function() {
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

  describe('getAllPlayers', function () {
    before(function () {
      this.graphQLQuery = 'query { getAllPlayers {id} }'
    })
    it('returns all players', async function() {
      await factory.createMany('player', 3)
      const results = await runGraphQLQuery(
        this.graphQLQuery,
        fields
      )

      expect(results.data.getAllPlayers.length).to.equal(3)
    })

    it('returns an empty array if there are no players', async function () {
      const results = await runGraphQLQuery(
        this.graphQLQuery,
        fields
      )

      expect(results.data.getAllPlayers.length).to.equal(0)
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

  describe('getUserById', function () {
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
})
