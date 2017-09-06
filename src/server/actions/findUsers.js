import mergeUsers from 'src/server/actions/mergeUsers'

export default async function findUsers(identifiers, options) {
  const {findUsers: findIDMUsers} = require('src/server/services/idmService')

  const {join} = options || {}
  const users = await findIDMUsers(identifiers, options)
  return mergeUsers(users, {skipNoMatch: true, join})
}
