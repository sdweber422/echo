import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime, GraphQLURL} from 'graphql-custom-types'

import {Player} from '../Player/schema'
import {Cycle} from '../Cycle/schema'

export const Vote = new GraphQLObjectType({
  name: 'Vote',
  description: 'An expression of interest in working on a certain Goal as a Project in a Cycle',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The vote UUID'},
    player: {type: Player, description: 'The Player who cast the Vote'},
    cycle: {type: Cycle, description: 'The Cycle '},
    goals: {type: new GraphQLList(GraphQLURL), description: 'The list of Goal URLs, in order of preference'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
