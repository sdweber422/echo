import {apiFetch} from './util'
import {getUserId} from './cache'

export default async function createDirectMessage(handle, msg) {
  const userId = await getUserId(handle)
  const imOpenResult = await apiFetch('/api/im.open', {
    method: 'POST',
    user: userId,
  })
  const result = await apiFetch('/api/chat.postMessage', {
    method: 'POST',
    body: {
      channel: imOpenResult.channel.id,
      text: msg,
      as_user: true, // eslint-disable-line camelcase
    },
  })

  return result.ok
}
