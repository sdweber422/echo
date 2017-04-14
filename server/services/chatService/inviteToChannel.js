import {apiFetch} from './util'
import {getChannelId, getUserId} from './cache'

export default function inviteToChannel(channel, handles) {
  const promises = handles.map(handle => _inviteUserToChannel(channel, handle))
  return Promise.all(promises)
}

async function _inviteUserToChannel(channel, handle) {
  const channelId = await getChannelId(channel)
  const userId = await getUserId(handle)
  const body = {
    channel: channelId,
    user: userId,
  }
  const result = await apiFetch('/api/channels.invite', {
    method: 'POST',
    body,
  }).catch(err => {
    // ignore errors if user is already in channel
    if (!err.message.includes('already_in_channel')) {
      throw err
    }
    return {ok: true, channel: {id: channelId, name: channel}}
  })
  return result.channel
}
