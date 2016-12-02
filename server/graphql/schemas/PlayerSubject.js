import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'PlayerSubject',
  description: 'A player that is the subject of a question',
  fields: () => {
    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The player\'s UUID'},
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The player\'s name'},
      handle: {type: new GraphQLNonNull(GraphQLString), description: 'The player\'s handle'},
      profileUrl: {type: GraphQLString, description: 'The player\'s profile URL'},
      avatarUrl: {type: GraphQLString, description: 'The player\'s avatar URL'},
    }
  },
})
