import {GraphQLObjectType} from 'graphql'

import rootFields from './queries'

export default new GraphQLObjectType({
  name: 'RootQuery',
  fields: () => rootFields
})
