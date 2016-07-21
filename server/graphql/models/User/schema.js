import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

import {Chapter} from '../Chapter/schema'

export const User = new GraphQLObjectType({
  name: 'User',
  description: 'A player in the game',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The user's UUID"},
    chapter: {type: Chapter, description: "The user's chapter"},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
