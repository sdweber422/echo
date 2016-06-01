import {GraphQLNonNull, GraphQLString, GraphQLID} from 'graphql'
import {GraphQLObjectType, GraphQLInputObjectType} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'

export const InputResponse = new GraphQLInputObjectType({
  name: 'InputResponse',
  description: 'A response to a question',
  fields: () => ({
    questionId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The the UUID of the question this is a repsonse to'
    },
    respondantId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The the UUID of the user authoring this response'
    },
    surveyId: {
      type: GraphQLID,
      description: 'The survey (if any) this response is associated with'
    },
    // TODO: figure out how to support Strings/IDs/Ints and lists in value and subject =/
    value: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The value of the response'
    },
    subject: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The subject of this response'
    },
  })
})

export const Response = new GraphQLObjectType({
  name: 'Response',
  description: 'A response to a question',
  fields: () => Object.assign({}, InputResponse.getFields(), {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The response\'s UUID'
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
