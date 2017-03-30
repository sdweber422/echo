import {apiFetch} from 'src/server/util/api'

export default function joinChannel(userName) {
  return apiFetch('http://chat.learnersguild.test/api/channels.join', {
    method: 'POST',
    token: config.server.chat.token,
    user: userName,
  })
  .then(result => result.channel)
}
