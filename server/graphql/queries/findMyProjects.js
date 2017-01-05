import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {findProjectsForUser} from 'src/server/db/project'
import {Project} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLList(Project),
  async resolve(source, args = {}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'findProjects')) {
      throw new GraphQLError('You are not authorized to do that')
    }
    return findProjectsForUser(currentUser.id)
  },
}
