import {normalize, Schema, arrayOf} from 'normalizr'

import {getGraphQLFetcher} from 'src/common/util'

export const LOAD_USERS_REQUEST = 'LOAD_USERS_REQUEST'
export const LOAD_USERS_SUCCESS = 'LOAD_USERS_SUCCESS'
export const LOAD_USERS_FAILURE = 'LOAD_USERS_FAILURE'

const usersSchema = arrayOf(new Schema('users'))

export default function loadUsers(ids) {
  return {
    types: [
      LOAD_USERS_REQUEST,
      LOAD_USERS_SUCCESS,
      LOAD_USERS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query ($ids: [ID]!) {
  getUsersByIds(ids: $ids) {
    id
    email
    name
    handle
    avatarUrl
    dateOfBirth
    timezone
  }
}
        `,
        variables: {
          ids,
        },
      }

      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth, process.env.IDM_BASE_URL)(query)
        .then(graphQLResponse => graphQLResponse.data.getUsersByIds)
        .then(users => normalize(users, usersSchema))
    },
    payload: {},
  }
}
