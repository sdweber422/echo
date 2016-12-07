import {GraphQLList} from 'graphql/type'

import {findProjectsForUser} from 'src/server/db/project'
import {Project} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLList(Project),
  async resolve(source, args = {}, {rootValue: {currentUser}}) {
    return findProjectsForUser(currentUser.id)
  },
}
