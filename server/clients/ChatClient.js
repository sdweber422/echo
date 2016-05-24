import fetch from 'isomorphic-fetch'

if (!process.env.CHAT_BASE_URL) {
  throw new Error('CHAT_BASE_URL must be set in environment')
}
const chatBaseUrl = process.env.CHAT_BASE_URL

export default class ChatClient {
  constructor() {
  }

  login() {
    return this.fetchFromChat('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `user=lg-bot&password=${process.env.CHAT_API_USER_SECRET}`,
    })
    .then(json => json.data)
  }

  async sendMessage(channel, msg) {
    const authHeaders = await this.authHeaders()
    const headers = Object.assign({}, authHeaders, {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    })
    return this.fetchFromChat(`/api/lg/rooms/${channel}/send`, {
      headers,
      method: 'POST',
      body: JSON.stringify({msg})
    })
    .then(json => json.result)
  }

  async createChannel(channelName, members = ['bundacia', 'lg-bot']) {
    const authHeaders = await this.authHeaders()
    const headers = Object.assign({}, authHeaders, {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    })
    return this.fetchFromChat('/api/bulk/createRoom', {
      headers,
      method: 'POST',
      body: JSON.stringify({
        rooms: [
          {name: channelName, members},
        ],
      })
    })
    .then(json => json.ids)
  }

  fetchFromChat(path, options) {
    const url = `${chatBaseUrl}${path}`
    return fetch(url, options)
      .then(resp => resp.json())
      .then(json => {
        if (json.status !== 'success') {
          return Promise.reject(json)
        }
        return json
      })
  }

  authHeaders() {
    // TODO: cache these headers for a few seconds
    return this.login().then(r => ({
      'X-User-Id': r.userId,
      'X-Auth-Token': r.authToken,
    }))
  }
}
