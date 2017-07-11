import {GraphQLNonNull, GraphQLID, GraphQLInt, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

import {resolvePhaseCurrentProjects} from 'src/server/graphql/resolvers'

export default new GraphQLObjectType({
  name: 'Phase',
  description: 'A phase of the program',
  fields: () => {
    const {Project} = require('src/server/graphql/schemas')

    return {
      id: {type: new GraphQLNonNull(GraphQLID), description: 'The phase UUID'},
      number: {type: new GraphQLNonNull(GraphQLInt), description: 'The phase number'},
      hasVoting: {type: new GraphQLNonNull(GraphQLBoolean), description: 'Projects in the phase can be formed by voting'},
      hasRetrospective: {type: new GraphQLNonNull(GraphQLBoolean), description: 'Projects in the phase will have a retrospective'},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
      updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
      currentProjects: {type: new GraphQLNonNull(new GraphQLList(Project)), description: 'Projects in phase and currently active cycle', resolve: resolvePhaseCurrentProjects},
    }
  },
})
