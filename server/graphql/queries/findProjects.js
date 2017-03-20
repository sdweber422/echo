import {GraphQLString} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import {findProjects} from 'src/server/db/project'
import {Project} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Project),
  args: {
    identifiers: {type: new GraphQLList(GraphQLString), description: 'A list of project identifiers'},
  },
  async resolve(source, args = {}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'findProjects')) {
      throw new LGNotAuthorizedError()
    }
    return findProjects(args.identifiers)
  },
}
