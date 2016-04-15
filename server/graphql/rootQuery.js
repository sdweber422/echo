import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/query'
import player from './models/Player/query'

const rootFields = Object.assign(chapter, player)

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
})
