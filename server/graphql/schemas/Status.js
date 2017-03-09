import {GraphQLBoolean} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'Status',
  description: 'The status of a response',
  fields: () => {
    return {
      success: {type: GraphQLBoolean, description: 'The request was successful'},
    }
  },
})
