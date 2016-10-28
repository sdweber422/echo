import {connect} from 'src/db'

import {getPlayerById} from './player'
import {getModeratorById} from './moderator'

const r = connect()

export function getUserById(id, options = {}) {
  return r.or(
    getPlayerById(id, options),
    getModeratorById(id, options)
  )
}
