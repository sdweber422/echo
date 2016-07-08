/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import {
  processProjectArtifactChange,
} from '../projectArtifactChanged'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('processNewCycle()', function () {
    beforeEach('create stubs', function () {
      this.chatClientStub = {
        sentMessages: {},
        sendMessage: (channel, msg) => {
          this.chatClientStub.sentMessages[channel] = this.chatClientStub.sentMessages[channel] || []
          this.chatClientStub.sentMessages[channel].push(msg)
        }
      }
    })

    describe('when a cycle has completed', function () {
      beforeEach(async function () {
        this.project = await factory.create('project', {
          artifactURL: 'https://example.com',
          name: 'curious-cats',
        })
      })

      it('sends a message to the chapter chatroom', function () {
        return processProjectArtifactChange(this.project, this.chatClientStub).then(() => {
          const msg = this.chatClientStub.sentMessages[this.project.name][0]
          expect(msg).to.match(/artifact.*https:\/\/example.com.*curious-cats has been updated/)
        })
      })
    })
  })
})
