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

// --------------------------------------------------------------------
// EXAMPLES:
//   The following shell session shows real
//   API responses from RocketChat using httpie.
// --------------------------------------------------------------------
// % http -f chat.learnersguild.dev/api/login user=lg-bot password=chat
// HTTP/1.1 200 OK
// X-Powered-By: Express
// access-control-allow-origin: *
// cache-control: no-store
// connection: close
// content-type: application/json
// date: Fri, 20 May 2016 12:28:10 GMT
// pragma: no-cache
// transfer-encoding: chunked
// vary: Accept-Encoding

// {
//     "data": {
//         "authToken": "L7Cf5bJAcNXkRuo0ZRyu0QmjzSIcFCO1QBpKYM0nE3g",
//         "userId": "L9Dnu2G2NSWm8cQpr"
//     },
//     "status": "success"
// }

// % http POST chat.learnersguild.dev/api/lg/rooms/welcome/send \
// > X-Auth-Token:Hfs3sF4xFuPaw1WPhsLzWR9nTw-IMuuZfwYND8BlSpV \
// > X-User-Id:L9Dnu2G2NSWm8cQpr \
// > msg='/me is a bot'
// HTTP/1.1 200 OK
// X-Powered-By: Express
// access-control-allow-origin: *
// cache-control: no-store
// connection: close
// content-type: application/json
// date: Fri, 20 May 2016 12:28:12 GMT
// pragma: no-cache
// transfer-encoding: chunked
// vary: Accept-Encoding

// {
//     "result": {
//         "_id": "79ugwPTBQ65EHw6BD",
//         "msg": "/me is a bot",
//         "rid": "cRSDeB4a5ePSNSMby",
//         "ts": "2016-05-20T12:28:12.064Z",
//         "u": {
//             "_id": "L9Dnu2G2NSWm8cQpr",
//             "username": "lg-bot"
//         }
//     },
//     "status": "success"
// }

// trevor@Trevors-MacBook-Pro ~/lg % http POST chat.learnersguild.dev/api/bulk/createRoom \
// > X-Auth-Token:BldWOV45eeQQoKcS6I8nEuiC35UsaD8scrRsWHZ1Yxl \
// > X-User-Id:L9Dnu2G2NSWm8cQpr \
// > rooms:='[{"name": "new-room2", "members": ["@bundacia", "@lg-bot"]}]'
// HTTP/1.1 200 OK
// X-Powered-By: Express
// access-control-allow-origin: *
// cache-control: no-store
// connection: close
// content-type: application/json
// date: Fri, 20 May 2016 14:53:45 GMT
// pragma: no-cache
// transfer-encoding: chunked
// vary: Accept-Encoding

// {
//   "ids": [
//     {
//       "rid": "BFWXgKacy8e4vjXJL"
//     }
//   ],
//   "status": "success"
// }
