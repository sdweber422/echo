import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export const ThinProject = new GraphQLObjectType({
  name: 'ThinProject',
  description: 'A "thin" project object with just the id',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
  })
})
