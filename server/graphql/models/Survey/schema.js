import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLObjectType, GraphQLUnionType, GraphQLEnumType, GraphQLList} from 'graphql/type'

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

export const SubjectTypeEnum = new GraphQLEnumType({
  name: 'SubjectTypeEnum',
  values: {
    team: {description: 'A multipart subject requiring responses about each member of a project team'},
    player: {description: 'A player in the game'},
  }
})

export const ResponseTypeEnum = new GraphQLEnumType({
  name: 'ResponseTypeEnum',
  values: {
    percentage: {description: 'A multipart question whose responses must add up to 100%'},
    text: {description: 'A free form text response'},
  }
})

const CommonSurveyQuestionFields = {
  id: {type: new GraphQLNonNull(GraphQLID), description: 'The id of the question'},
  subjectType: {type: new GraphQLNonNull(SubjectTypeEnum), description: 'The type of the subject '},
  type: {type: new GraphQLNonNull(ResponseTypeEnum), description: 'The expected type of the response'},
  body: {type: new GraphQLNonNull(GraphQLString), description: 'The body of the question'},
}

export const MultiSubjectSurveyQuestion = new GraphQLObjectType({
  name: 'MultiSubjectSurveyQuestion',
  description: 'A survey question about multiple subjects',
  fields: () => (Object.assign({},
    {
      subject: {
        type: new GraphQLNonNull(new GraphQLList(GraphQLID)),
        description: 'The list of ids of the persons or things this question is asking about'
      },
    },
    CommonSurveyQuestionFields
  ))
})

export const SingleSubjectSurveyQuestion = new GraphQLObjectType({
  name: 'SingleSubjectSurveyQuestion',
  description: 'A survey question about a single subject',
  fields: () => (Object.assign({},
    {
      subject: {
        type: new GraphQLNonNull(GraphQLID),
        description: 'The id of the person or this question is asking about'
      },
    },
    CommonSurveyQuestionFields
  ))
})

export const SurveyQuestion = new GraphQLUnionType({
  name: 'SurveyQuestion',
  types: [SingleSubjectSurveyQuestion, MultiSubjectSurveyQuestion],
  resolveType(value) {
    if (Array.isArray(value.subject)) {
      return MultiSubjectSurveyQuestion
    }
    return SingleSubjectSurveyQuestion
  }
})

export const Survey = new GraphQLObjectType({
  name: 'Survey',
  description: 'A survey of questions used for retrospectives',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: "The survey's user UUID"},
    project: {type: ThinProject, description: "The player's chapter"},
    cycle: {type: ThinCycle, description: "The cycle's chapter"},
    questions: {type: new GraphQLList(SurveyQuestion), description: 'The questions for the survey'},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was created'},
    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime), description: 'When this record was last updated'},
  })
})
