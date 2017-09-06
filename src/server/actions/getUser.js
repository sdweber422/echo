import mergeUsers from 'src/server/actions/mergeUsers'

export default async function getUser(identifier, options) {
  const {getUser: getIDMUser} = require('src/server/services/idmService')

  const user = await getIDMUser(identifier, options)
  return user ? (await mergeUsers([user], {skipNoMatch: true}))[0] : null
}
