import {GraphQLFloat, GraphQLString} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'
import {GraphQLDateTime} from 'graphql-custom-types'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default new GraphQLObjectType({
  name: 'UserProjectEvaluation',
  description: 'An evaluation of a user\'s performance on a project',
  fields: () => {
    const {UserProfile} = require('src/server/graphql/schemas')

    return {
      submittedBy: {type: UserProfile, description: 'The evaluation submitter'},
      createdAt: {type: GraphQLDateTime, description: 'The datetime of the evaluation creation'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: {type: GraphQLFloat, description: 'The culture contribution rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE]: {type: GraphQLFloat, description: 'The culture contribution challenge rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT]: {type: GraphQLFloat, description: 'The culture contribution engagement rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT]: {type: GraphQLFloat, description: 'The culture contribution enjoyment rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY]: {type: GraphQLFloat, description: 'The culture contribution safety rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE]: {type: GraphQLFloat, description: 'The culture contribution structure rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT]: {type: GraphQLFloat, description: 'The culture contribution support rating'},
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH]: {type: GraphQLFloat, description: 'The culture contribution truth rating'},
      [STAT_DESCRIPTORS.FRICTION_REDUCTION]: {type: GraphQLFloat, description: 'The friction reduction rating'},
      [STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP]: {type: GraphQLFloat, description: 'The flexible leadership rating'},
      [STAT_DESCRIPTORS.GENERAL_FEEDBACK]: {type: GraphQLString, description: 'General text feedback'},
      [STAT_DESCRIPTORS.RECEPTIVENESS]: {type: GraphQLString, description: 'The receptiveness rating'},
      [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: {type: GraphQLFloat, description: 'The relative contribution rating'},
      [STAT_DESCRIPTORS.RESULTS_FOCUS]: {type: GraphQLFloat, description: 'The results focus rating'},
      [STAT_DESCRIPTORS.TEAM_PLAY]: {type: GraphQLFloat, description: 'The team play rating'},
      [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: {type: GraphQLFloat, description: 'The technical skill rating'},
    }
  },
})
