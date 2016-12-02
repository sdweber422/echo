import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectReviewResponse',
  description: 'A named question and response value',
  fields: () => {
    return {
      name: {type: new GraphQLNonNull(GraphQLString), description: 'The question name'},
      value: {type: GraphQLString, description: 'The response to the question'},
    }
  },
})
