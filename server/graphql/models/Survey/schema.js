import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

// TODO: move these schemas into the appropriate places, consider if they neeed to be "less thin"
export const ThinProject = new GraphQLObjectType({
  name: 'ThinProject',
  description: 'A "thin" project object with just the id',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The project's UUID"},
  })
})

export const ThinCycle = new GraphQLObjectType({
  name: 'ThinCycle',
  description: 'A "thin" cycle object with just the id',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The cycle's UUID"},
  })
})

export const SurveyQuestionItem = new GraphQLObjectType({
  name: 'SurveyQuestionItem',
  description: 'A question on this survey. Links a question to a specific subject',
  fields: () => ({
    subject: {type: new GraphQLNonNull(new GraphQLList(GraphQLID)), description: 'The person or thing this question is asking about'},
    // TODO: make this (at least) a thin question obejct
    questionId: {type: new GraphQLNonNull(GraphQLID), description: 'The id of the question'},
  })
})

export const Survey = new GraphQLObjectType({
  name: 'Survey',
  description: 'A survey of questions used for retrospectives',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The survey's user UUID"},
    project: {type: ThinProject, description: "The player's chapter"},
    cycle: {type: ThinCycle, description: "The cycle's chapter"},
    questions: {type: new GraphQLList(SurveyQuestionItem), description: 'The questions for the survey'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
