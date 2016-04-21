import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/query'
import player from './models/Player/query'
import cycle from './models/Cycle/query'

const rootFields = Object.assign(chapter, player, cycle)

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
})
