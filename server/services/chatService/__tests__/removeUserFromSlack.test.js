/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'
import factory from 'src/test/factories'
import config from 'src/config'
import {APIError} from 'src/server/util/api'
import deactivateSlackUser from '../deactivateSlackUser'

describe(testContext(__filename), function () {
  describe('deactivateSlackUser()', function () {
    beforeEach(async function () {
      this.user = await factory.build('user')
    })

    it('returns true on success', async function () {
      nock(config.server.chat.scimApiURL)
        .delete(`/Users/${this.user.id}`)
        .reply(200, {})

      const result = await deactivateSlackUser(this.user.id)

      expect(result).to.be.ok
    })

    it('throws an exception on failure', function () {
      nock(config.server.chat.scimApiURL)
        .delete(`/Users/${this.user.id}`)
        .reply(400, {error: 'You broke it again :('})

      const promise = deactivateSlackUser(this.user.id)
      return expect(promise).to.be.rejectedWith(APIError)
    })
  })
})
