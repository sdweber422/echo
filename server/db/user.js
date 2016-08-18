import r from 'src/db/connect'

import {getPlayerById} from './player'
import {getModeratorById} from './moderator'

export function getUserById(id, options = {}) {
  return r.or(
    getPlayerById(id, options),
    getModeratorById(id, options)
  )
}
