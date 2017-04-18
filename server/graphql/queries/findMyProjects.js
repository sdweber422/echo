import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import {Project, findProjectsForUser} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Project),
  async resolve(source, args = {}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'findProjects')) {
      throw new LGNotAuthorizedError()
    }
    return findProjectsForUser(currentUser.id)
  },
}
