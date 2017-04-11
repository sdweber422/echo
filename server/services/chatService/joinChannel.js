import {apiFetch, usernameFor} from './util'

export default function joinChannel(userName) {
  return apiFetch('/api/channels.join', {
    method: 'POST',
    body: {user: usernameFor(userName)},
  })
    .then(result => result.channel)
}
