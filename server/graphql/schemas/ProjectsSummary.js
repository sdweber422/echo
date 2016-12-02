import {GraphQLNonNull, GraphQLInt} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectsSummary',
  description: 'A summary of project-related information for the player and chapter',
  fields: () => {
    return {
      numActiveProjectsForCycle: {type: new GraphQLNonNull(GraphQLInt), description: 'The number of active projects in the current cycle'},
      numTotalProjectsForPlayer: {type: new GraphQLNonNull(GraphQLInt), description: 'The number of total projects in which the player participated'},
    }
  },
})
