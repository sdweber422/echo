import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

import {Chapter} from '../Chapter/schema'

export const Player = new GraphQLObjectType({
  name: 'Player',
  description: 'A player in the game',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The player's user UUID"},
    chapter: {type: Chapter, description: "The player's chapter"},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
