import {apiFetch} from 'src/server/util/api'

export default function createChannelMessage(channelName, msg) {
  return apiFetch('http://chat.learnersguild.test/api/chat.postMessage', {
    method: 'POST',
    token: config.server.chat.token,
    channel: channelName,
    text: msg,
  })
  .then(result => result.channel)
}
