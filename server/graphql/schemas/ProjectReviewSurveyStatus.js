import {GraphQLNonNull, GraphQLBoolean} from 'graphql'
import {GraphQLObjectType, GraphQLList} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'ProjectReviewSurveyStatus',
  description: 'Information about the status of a players project review',
  fields: () => {
    const {Project, NamedResponseValueGroup} = require('src/server/graphql/schemas')

    return {
      completed: {type: new GraphQLNonNull(GraphQLBoolean), description: 'True if the player has submitted responses for all the questions on the survey'},
      responses: {type: new GraphQLList(NamedResponseValueGroup), description: 'The players responses'},
      project: {type: Project, description: 'The project being reviewed'},
    }
  },
})
