import config from 'src/config'

const queues = {
  messageSent: 'chatMessageSent',
}

import {default as createChannel} from './createChannel'
import {default as createChannelMessage} from './createChannelMessage'
import {default as createDirectMessage} from './createDirectMessage'
import {default as deleteChannel} from './deleteChannel'
import {default as joinChannel} from './joinChannel'

import function sendChannelMessage(channelName, message, options) {
  return _queueMessage('channel', channelName, message, options)
}

import function sendDirectMessage(userName, message, options) {
  return _queueMessage('user', userName, message, options)
}

function _queueMessage(type, target, message, options = {}) {
  const jobService = require('src/server/services/jobService')

  const payload = {type, target, msg: message}
  return jobService.createJob(queues.messageSent, payload, {
    attempts: config.server.chat.retries.message,
    backoff: {type: 'exponential'},
    ...options
  })
}

export default {
  createChannel,
  createChannelMessage,
  createDirectMessage,
  deleteChannel,
  joinChannel,
  sendChannelMessage,
  sendDirectMessage
}
