import {GraphQLInt} from 'graphql'
import {GraphQLObjectType} from 'graphql/type'

export default new GraphQLObjectType({
  name: 'SurveyQuestionValidationOptions',
  description: 'Suvey question validation options',
  fields: () => {
    return {
      min: {type: GraphQLInt, description: 'The minimum allowed value or length'},
      max: {type: GraphQLInt, description: 'The maximum allowed value or length'},
      sum: {type: GraphQLInt, description: 'The required sum of grouped values'},
      length: {type: GraphQLInt, description: 'The required length'},
      integer: {type: GraphQLInt, description: 'Value must be an integer'},
    }
  },
})
