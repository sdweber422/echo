import {apiFetch} from './util'
import {addChannelToCache} from './cache'

export default async function createChannel(channelName) {
  const newChannel = await apiFetch('/api/channels.create', {
    method: 'POST',
    body: {name: channelName},
  })

  await addChannelToCache(newChannel)
  return newChannel
}
