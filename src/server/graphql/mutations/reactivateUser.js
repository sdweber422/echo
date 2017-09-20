import {GraphQLNonNull, GraphQLID} from 'graphql'

import reactivateUser from 'src/server/actions/reactivateUser'
import {userCan} from 'src/common/util'
import {UserProfile} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: UserProfile,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLID), description: 'The user ID'}
  },
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'reactivateUser')) {
      throw new LGNotAuthorizedError('You are not authorized to reactivate users.')
    }

    return reactivateUser(identifier)
  }
}
