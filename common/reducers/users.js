import {
  LOAD_USERS_REQUEST,
  LOAD_USERS_SUCCESS,
  LOAD_USERS_FAILURE,
} from 'src/common/actions/loadUsers'

import {mergeEntities} from 'src/common/util'

const initialState = {
  users: {},
  isBusy: false,
}

export function users(state = initialState, action) {
  switch (action.type) {
    case LOAD_USERS_REQUEST:
      return Object.assign({}, state, {
        isBusy: true,
      })
    case LOAD_USERS_SUCCESS:
      {
        const users = mergeEntities(state.users, action.response.entities.users)
        return Object.assign({}, state, {
          isBusy: false,
          users,
        })
      }
    case LOAD_USERS_FAILURE:
      return Object.assign({}, state, {
        isBusy: false,
      })
    default:
      return state
  }
}
