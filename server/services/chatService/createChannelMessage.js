import {apiFetch} from './util'
import {getChannelId} from './cache'

export default async function createChannelMessage(channel, msg) {
  const channelId = await getChannelId(channel)

  const result = await apiFetch('/api/chat.postMessage', {
    method: 'POST',
    body: {
      channel: channelId,
      text: msg,
      as_user: true, // eslint-disable-line camelcase
    },
  })
  return result.channel
}
