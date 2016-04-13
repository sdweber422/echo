import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/query'

const rootFields = Object.assign(chapter)

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
})
