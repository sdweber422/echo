import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/query'
import player from './models/Player/query'
import cycle from './models/Cycle/query'
import vote from './models/Vote/query'
import survey from './models/Survey/query'

const rootFields = Object.assign(chapter, player, cycle, vote, survey)

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
})
