import md5 from 'md5'
import fetch from 'isomorphic-fetch'

export default function getAvatarImageURL(user) {
  if (!user.email) {
    return Promise.resolve(false)
  }
  const gravatarURL = `https://www.gravatar.com/avatar/${md5(user.email.toLowerCase())}`
  return fetch(`${gravatarURL}.jpg?d=404`, {method: 'HEAD'})
    .then(resp => {
      return (resp.status !== 404) ? gravatarURL : null
    })
}
