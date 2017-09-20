import {apiFetch} from './util'
import {addChannelToCache} from './cache'

export default async function createChannel(channelName) {
  const {channel} = await apiFetch('/api/channels.create', {
    method: 'POST',
    body: {name: channelName},
  })
  await addChannelToCache(channel)
  return channel.channel
}
