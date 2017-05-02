import {apiFetch} from './util'

export default function setChannelTopic(channel, topic) {
  return apiFetch('/api/channels.setTopic', {
    method: 'POST',
    body: {
      channel,
      topic,
    },
  })
}
