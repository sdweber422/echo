import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

export const ChapterHistoryItem = new GraphQLObjectType({
  name: 'ChapterHistoryItem',
  description: 'A historical record of when a player was in a given chapter',
  fields: () => ({
    chapterId: {type: new GraphQLNonNull(GraphQLID), description: "The player's historical chapter UUID"},
    until: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this player left this chapter'},
  })
})

export const Player = new GraphQLObjectType({
  name: 'Player',
  description: 'A player in the game',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The player's user UUID"},
    chapterId: {type: new GraphQLNonNull(GraphQLID), description: "The player's chapter UUID"},
    chapterHistory: {type: new GraphQLList(ChapterHistoryItem), description: "The player's chapter history"},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
