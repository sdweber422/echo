import {GraphQLInt, GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'PlayerGoalRank',
  description: 'A Player and their rank for a particular Goal',
  fields: () => {
    return {
      playerId: {type: new GraphQLNonNull(GraphQLID), description: 'The Player UUID'},
      goalRank: {type: new GraphQLNonNull(GraphQLInt), description: 'The Player rank for the given Goal'},
    }
  },
})
