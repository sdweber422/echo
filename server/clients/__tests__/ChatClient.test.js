/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import ChatClient from '../ChatClient'

describe(testContext(__filename), function () {
  beforeEach(function () {
    this.loginResponse = {
      data: {
        authToken: 'L7Cf5bJAcNXkRuo0ZRyu0QmjzSIcFCO1QBpKYM0nE3g',
        userId: 'L9Dnu2G2NSWm8cQpr'
      },
      status: 'success'
    }
    this.apiScope = nock(process.env.CHAT_BASE_URL)
      .post('/api/login')
      .reply(200, this.loginResponse)
  })

  describe('login()', function () {
    it('returns the parsed response on success', function () {
      const client = new ChatClient()
      return expect(client.login()).to.eventually.deep.equal(this.loginResponse.data)
    })
  })

  describe('sendMessage()', function () {
    beforeEach(function () {
      this.sendMessageAPIResponse = {
        result: {
          _id: '79ugwPTBQ65EHw6BD',
          msg: 'the message',
          rid: 'cRSDeB4a5ePSNSMby',
          ts: '2016-05-20T12:28:12.064Z',
          u: {
            _id: 'L9Dnu2G2NSWm8cQpr',
            username: 'echo'
          }
        },
        status: 'success'
      }
      this.apiScope.post('/api/lg/rooms/channel/send')
        .reply(200, this.sendMessageAPIResponse)
    })

    it('returns the parsed response on success', function () {
      const client = new ChatClient()
      return (
        expect(client.sendMessage('channel', 'message'))
          .to.eventually.deep.equal(this.sendMessageAPIResponse.result)
      )
    })
  })

  describe('createChannel()', function () {
    beforeEach(function () {
      this.createChannelAPIResponse = {
        status: 'success',
        ids: [{rid: 'BFWXgKacy8e4vjXJL'}]
      }
      this.apiScope.post('/api/bulk/createRoom')
        .reply(200, this.createChannelAPIResponse)
    })

    it('returns the parsed response on success', function () {
      const client = new ChatClient()
      return (
        expect(client.createChannel('channel', ['echo']))
          .to.eventually.deep.equal(this.createChannelAPIResponse.ids)
      )
    })
  })

  describe('deleteChannel()', function () {
    beforeEach(function () {
      this.client = new ChatClient()
      this.deleteChannelSuccessAPIResponse = {
        status: 'success',
        result: 1,
      }
      this.apiScope.delete('/api/lg/rooms/existing-room')
        .reply(200, this.deleteChannelSuccessAPIResponse)
      this.deleteChannelFailureAPIResponse = {
        status: 'fail',
        message: "TypeError::Cannot read property '_id' of undefined",
      }
      this.apiScope.delete('/api/lg/rooms/non-existant-room')
        .reply(500, this.deleteChannelFailureAPIResponse)
    })

    it('returns true if the channel exists', function () {
      return (
        expect(this.client.deleteChannel('existing-room'))
          .to.eventually.deep.equal(true)
      )
    })

    it('throws an error if the channel does not exist', function () {
      return (
        expect(this.client.deleteChannel('non-existant-room'))
          .to.eventually.be.rejected
      )
    })
  })
})
