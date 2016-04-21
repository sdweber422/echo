import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/mutation'
import player from './models/Player/mutation'
import cycle from './models/Cycle/mutation'

const rootFields = Object.assign(chapter, player, cycle)

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => rootFields
})
