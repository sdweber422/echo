import {Moderator, Player} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import {LGBadRequestError} from 'src/server/util/error'

export default async function mergeUsers(users, options) {
  if (!Array.isArray(users)) {
    throw new LGBadRequestError('Invalid users input:', users)
  }
  if (users.length === 0) {
    return []
  }

  const {skipNoMatch} = options || {}
  const userIds = users.map(u => u.id)
  const players = mapById(await Player.getAll(...userIds))
  const moderators = mapById(await Moderator.getAll(...userIds))

  return Object.values(users.reduce((result, user) => {
    const gameUser = players.get(user.id) || moderators.get(user.id)
    if (gameUser) {
      // only return in results if user has a game account
      result[user.id] = Object.assign({}, user, gameUser)
    } else if (!skipNoMatch) {
      throw new LGBadRequestError(`User not found for id ${user.id}, user merge aborted`)
    }
    return result
  }, {}))
}
