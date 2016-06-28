import {GraphQLNonNull, GraphQLString, GraphQLList, GraphQLInt, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLInputObjectType} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

export const CLISurveyResponse = new GraphQLInputObjectType({
  name: 'CLISurveyResponse',
  description: 'A response to a question on a survey by number',
  fields: () => ({
    questionNumber: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'The number of the question in the survey'
    },
    responseParams: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: 'The positional parameters as parsed by the CLI'
    },
  })
})

export const CLINamedSurveyResponse = new GraphQLInputObjectType({
  name: 'CLINamedSurveyResponse',
  description: 'A Response to a named question on a survey',
  fields: () => ({
    questionName: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The name of the question in the survey'
    },
    responseParams: {
      type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
      description: 'The positional parameters as parsed by the CLI'
    },
  })
})

export const Response = new GraphQLObjectType({
  name: 'Response',
  description: 'A response to a question',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The response\'s UUID'
    },
    questionId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The the UUID of the question this is a repsonse to'
    },
    respondentId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The the UUID of the user authoring this response'
    },
    surveyId: {
      type: GraphQLID,
      description: 'The survey (if any) this response is associated with'
    },
    // TODO: figure out how to support Strings/IDs/Ints and lists in value
    value: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The value of the response'
    },
    subject: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The subject of this response'
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'When this record was created'
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'When this record was last updated'
    },
  })
})
