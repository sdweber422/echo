/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import {
  processNewCycle,
} from '../cycleInitialized'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processNewCycle()', function () {
    beforeEach('create stubs', function () {
      this.chatClientStub = {
        sentMessages: {},
        sendChannelMessage: (channel, msg) => {
          this.chatClientStub.sentMessages[channel] = this.chatClientStub.sentMessages[channel] || []
          this.chatClientStub.sentMessages[channel].push(msg)
        }
      }
    })

    describe('when a new cycle is created', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter', {goalRepositoryURL: 'https://example.com'})
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 2,
        })
      })

      it('sends a message to the chapter chatroom', function () {
        return processNewCycle(this.cycle, this.chatClientStub).then(() => {
          const msg = this.chatClientStub.sentMessages[this.chapter.channelName][0]
          expect(msg).to.match(/Voting is now open for cycle 2/)
          expect(msg).to.match(/goal library.*https:\/\/example\.com.*vote --help/)
        })
      })
    })
  })
})
