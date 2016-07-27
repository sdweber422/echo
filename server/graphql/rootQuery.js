import {GraphQLObjectType} from 'graphql'
import chapter from './models/Chapter/query'
import user from './models/User/query'
import cycle from './models/Cycle/query'
import vote from './models/Vote/query'
import survey from './models/Survey/query'
import project from './models/Project/query'

const rootFields = Object.assign(chapter, user, cycle, vote, survey, project)

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
})
