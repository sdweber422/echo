import {GraphQLObjectType} from 'graphql'

import rootFields from './mutations'

export default new GraphQLObjectType({
  name: 'RootMutation',
  fields: () => rootFields
})
