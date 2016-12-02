import {GraphQLString, GraphQLNonNull} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLURL} from 'graphql-custom-types'

export default new GraphQLObjectType({
  name: 'Goal',
  description: 'A potential Project to work on',
  fields: () => {
    return {
      url: {type: new GraphQLNonNull(GraphQLURL), description: 'The Goal URL'},
      title: {type: GraphQLString, description: 'The Goal Title'},
    }
  },
})
