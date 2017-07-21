import {GraphQLInt} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {Project} from 'src/server/graphql/schemas'
import {resolveFindProjectsForCycle} from 'src/server/graphql/resolvers'

export default {
  type: new GraphQLList(Project),
  args: {
    cycleNumber: {type: GraphQLInt, description: 'A cycle number'},
  },
  resolve: resolveFindProjectsForCycle,
}
