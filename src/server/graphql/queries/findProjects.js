import {GraphQLString} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {Project} from 'src/server/graphql/schemas'
import {userCan} from 'src/common/util'
import {LGNotAuthorizedError} from 'src/server/util/error'
import {findProjects} from 'src/server/services/dataService'

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
