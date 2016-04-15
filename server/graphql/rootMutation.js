import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/mutation'
import player from './models/Player/mutation'

const rootFields = Object.assign(chapter, player)

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => rootFields
})
