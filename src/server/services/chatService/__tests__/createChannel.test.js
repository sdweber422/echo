/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import stubs from 'src/test/stubs'
import {useFixture} from 'src/test/helpers'

import testChannel from './data/createChannel'

describe(testContext(__filename), function () {
  beforeEach(function () {
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.jobService.disable()
  })

  describe('chatService', function () {
    const {createChannel} = require('../index')

    describe('createChannel()', function () {
      beforeEach(function () {
        const channelName = testChannel.channel.name
        useFixture.nockClean()
        useFixture.nockChatCreateChannel(channelName, testChannel)
      })

      it('returns the parsed response on success', function () {
        const result = createChannel(this.name)
        return expect(result).to.eventually.deep.equal(this.createChannelResponse)
      })
    })
  })
})
