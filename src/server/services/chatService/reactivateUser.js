import {apiFetch} from 'src/server/util/api'
import {scimApiURL, headers} from './util'

export default function reactivateUser(userId) {
  const reactivateUserURL = scimApiURL(`/Users/${userId}`)
  return apiFetch(reactivateUserURL, {
    method: 'PATCH',
    headers: headers(),
    body: '{active: true}'
  })
    .then(() => true)
}
