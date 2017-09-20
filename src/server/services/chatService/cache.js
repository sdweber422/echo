import cacheManager from 'cache-manager'
import Promise from 'bluebird'
import getChannelList from './getChannelList'
import getUserList from './getUserList'
import {usernameFor} from './util'

const memoryCache = cacheManager.caching({
  store: 'memory',
  ttl: 2880 * 60, // 48-hour expiration (in seconds)
})

const USER_KEY = 'user_'
const CHANNEL_KEY = 'channel_'

export async function getUserId(userHandle) {
  const userName = usernameFor(userHandle)
  const userKey = _buildKey(USER_KEY, userName)
  return memoryCache.wrap(userKey, async () => {
    await _refreshUsers()
    return memoryCache.get(userKey)
  })
}

export async function getChannelId(channelName) {
  const channelKey = _buildKey(CHANNEL_KEY, channelName)
  return memoryCache.wrap(channelKey, async () => {
    await _refreshChannels()
    return memoryCache.get(channelKey)
  })
}

export async function refreshCache() {
  await Promise.all([
    _refreshUsers(),
    _refreshChannels()
  ])
}

export async function addChannelToCache(channel) {
  const newChannel = await channel
  await memoryCache.set(_buildKey(CHANNEL_KEY, newChannel.name), newChannel.id)
}

async function _refreshUsers() {
  const users = (await getUserList()).members
  await Promise.each(users, ({name, id}) => memoryCache.set(_buildKey(USER_KEY, name), id))
}

async function _refreshChannels() {
  const channels = (await getChannelList()).channels
  await Promise.each(channels, ({name, id}) => memoryCache.set(_buildKey(CHANNEL_KEY, name), id))
}

function _buildKey(keyType, name) {
  return keyType + name.toLowerCase()
}
