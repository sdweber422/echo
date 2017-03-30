import {apiFetch} from 'src/server/util/api'

export default function createDirectMessage(userName, msg) {
  return apiFetch('http://chat.learnersguild.test/api/im.open', {
    method: 'POST',
    token: config.server.chat.token,
    user: userName,
  })
  .then(result => {
    return apiFetch('http://chat.learnersguild.test/api/chat.postMessage', {
      method: 'POST',
      token: config.server.chat.token,
      channel: result.channelName,
      text: msg,
    })
  })
  .then(result => result.ok)
}
