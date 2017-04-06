import {
  FIND_USERS_REQUEST,
  FIND_USERS_SUCCESS,
  FIND_USERS_FAILURE,
  DEACTIVATE_USER_REQUEST,
  DEACTIVATE_USER_SUCCESS,
  DEACTIVATE_USER_FAILURE,
} from 'src/common/actions/types'

import {mergeEntities} from 'src/common/util'

const initialState = {
  users: {},
  isBusy: false,
}

export default function users(state = initialState, action) {
  switch (action.type) {
    case FIND_USERS_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case FIND_USERS_SUCCESS:
      {
        const users = mergeEntities(state.users, action.response.entities.users)
        return Object.assign({}, state, {
          isBusy: false,
          users,
        })
      }
    case FIND_USERS_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    case DEACTIVATE_USER_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case DEACTIVATE_USER_SUCCESS:
      {
        const user = action.response || {}
        const users = Object.assign({}, state.users, {[user.id]: user})
        return Object.assign({}, state, {
          isBusy: false,
          users,
        })
      }

    case DEACTIVATE_USER_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
