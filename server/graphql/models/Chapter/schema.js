import {GraphQLString, GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

export const Chapter = new GraphQLObjectType({
  name: 'Chapter',
  description: 'A group of players in the same location',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The chapter UUID'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter name'},
    channelName: {type: new GraphQLNonNull(GraphQLString), description: 'The chat channel name'},
    timezone: {type: GraphQLString, description: 'The user timezone'},
    cycleDuration: {type: new GraphQLNonNull(GraphQLString), description: 'Duration of the cycle'},
    cycleEpoch: {type: new GraphQLNonNull(GraphQLDateTime), description: 'The timestamp when the first cycle begins'},
    inviteCodes: {type: new GraphQLList(GraphQLString), description: 'The invite codes associated with this chapter'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
