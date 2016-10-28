/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {getUserById} from 'src/server/db/user'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getUserById()', function () {
    it('returns a player if present', async function () {
      const player = await factory.create('player')
      expect(await getUserById(player.id)).to.deep.eq(player)
    })

    it('returns a moderator if present', async function () {
      const moderator = await factory.create('moderator')
      expect(await getUserById(moderator.id)).to.deep.eq(moderator)
    })

    it('returns null when no user or moderator with the given id', async function () {
      const validUUID = 'e79fd771-6f19-4b35-bfa1-57a1174964f1'
      expect(await getUserById(validUUID)).to.be.null
    })
  })
})
