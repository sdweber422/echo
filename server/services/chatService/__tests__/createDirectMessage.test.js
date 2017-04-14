/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import stubs from 'src/test/stubs'
import {useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(function () {
    useFixture.nockClean()
    this.responses = {}
    this.apiScope = nock(config.server.chat.baseURL)
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const {createDirectMessage} = require('../index')

    describe('createDirectMessage()', function () {
      beforeEach(function () {
        this.user = 'pllearns'
        this.channel = '12345'
        this.message = 'Rubber Baby Buggy Bumpers'
        useFixture.nockChatServiceCache([this.channel], [this.user])
        this.apiScope
          .post('/api/im.open')
          .reply(200, {
            ok: true,
            channel: {id: this.channel},
          })
          .post('/api/chat.postMessage')
          .reply(200, {
            ok: true,
            channel: this.channel,
            message: {
              text: this.message,
            },
          })
      })

      it('returns the parsed response on success', function () {
        const result = createDirectMessage(this.user, this.message)
        return expect(result).to.eventually.deep.equal(true)
      })
    })
  })
})
