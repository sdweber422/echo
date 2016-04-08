import {GraphQLObjectType} from 'graphql'

// const rootFields = Object.assign(..., ...)

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => {}, // rootFields
})
