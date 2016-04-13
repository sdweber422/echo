import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/mutation'

const rootFields = Object.assign(chapter)

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => rootFields
})
