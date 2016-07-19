import fetch from 'isomorphic-fetch'

function _assertEnvironment() {
  if (!process.env.CRM_API_BASE_URL) {
    throw new Error('CRM_API_BASE_URL must be set in environment')
  }
  if (!process.env.CRM_API_KEY) {
    throw new Error('CRM_API_KEY must be set in environment')
  }
}

function crmURL(path) {
  _assertEnvironment()
  return `${process.env.CRM_API_BASE_URL}${path}?hapikey=${process.env.CRM_API_KEY}`
}

export function getContactByEmail(email) {
  const encodedEmail = encodeURIComponent(email)
  return fetch(crmURL(`/contacts/v1/contact/email/${encodedEmail}/profile`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    }
  }).then(resp => {
    if (!resp.ok) {
      throw new Error(`Couldn't get contact by email: ${resp.statusText}`)
    }
    return resp.json()
  })
}

const playerSignedUpBody = JSON.stringify({
  properties: [{
    property: 'signed_up_for_echo',
    value: true,
  }]
})
export function notifyContactSignedUp(email) {
  return getContactByEmail(email)
    .then(contact => {
      return fetch(crmURL(`/contacts/v1/contact/vid/${contact.vid}/profile`), {
        method: 'POST',
        headers: {
          'Accept:': 'application/json',
          'Content-Type': 'application.json'
        },
        body: playerSignedUpBody,
      }).then(resp => {
        if (!resp.ok) {
          throw new Error(`Couldn't notify that contact signed up: ${resp.statusText}`)
        }
        // API returns statusCode 204 with no body
        return true
      })
    })
}
