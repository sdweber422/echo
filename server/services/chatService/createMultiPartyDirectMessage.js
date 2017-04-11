import {apiFetch, usernameFor} from './util'

export default function createMultiPartyDirectMessage(users, msg) {
  const userNames = users.map(user => usernameFor(user))
  return apiFetch('/api/mpim.open', {
    method: 'POST',
    body: {
      users: userNames.join(',')
    }
  })
    .then(result => {
      return apiFetch('/api/chat.postMessage', {
        method: 'POST',
        body: {
          channel: result.group.id,
          text: msg,
          as_user: true, // eslint-disable-line camelcase
        },
      })
    })
    .then(result => result.ok)
}
