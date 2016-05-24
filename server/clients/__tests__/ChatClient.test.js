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
    nock(process.env.CHAT_BASE_URL)
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
            username: 'lg-bot'
          }
        },
        status: 'success'
      }
      nock(process.env.CHAT_BASE_URL)
        .matchHeader('X-User-Id', /.+/)
        .matchHeader('X-Auth-Token', /.+/)
        .post('/api/lg/rooms/channel/send')
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
      nock(process.env.CHAT_BASE_URL)
        .matchHeader('X-User-Id', /.+/)
        .matchHeader('X-Auth-Token', /.+/)
        .post('/api/bulk/createRoom')
        .reply(200, this.createChannelAPIResponse)
    })

    it('returns the parsed response on success', function () {
      const client = new ChatClient()
      return (
        expect(client.createChannel('channel', ['lg-bot']))
          .to.eventually.deep.equal(this.createChannelAPIResponse.ids)
      )
    })
  })
})
