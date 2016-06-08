import {GraphQLNonNull, GraphQLID, GraphQLString} from 'graphql'
import {GraphQLObjectType, GraphQLInterfaceType, GraphQLUnionType, GraphQLEnumType, GraphQLList} from 'graphql/type'

import {GraphQLDateTime} from 'graphql-custom-types'
import {ThinCycle} from '../../../../server/graphql/models/Cycle/schema'
import {ThinProject} from '../../../../server/graphql/models/Project/schema'

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
  responseType: {type: new GraphQLNonNull(ResponseTypeEnum), description: 'The expected type of the response'},
  body: {type: new GraphQLNonNull(GraphQLString), description: 'The body of the question'},
}

const SurveyQuestionInterface = new GraphQLInterfaceType({
  name: 'SurveyQuestionInterface',
  fields: () => CommonSurveyQuestionFields,
  resolveType: resolveSurveyQuestionType,
})

export const PlayerSubject = new GraphQLObjectType({
  name: 'PlayerSubject',
  description: 'A describes a player that is the subject of a question',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The player\'s UUID'
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The player\'s name'
    },
    handle: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The player\'s handle'
    },
  })
})

export const MultiSubjectSurveyQuestion = new GraphQLObjectType({
  name: 'MultiSubjectSurveyQuestion',
  description: 'A survey question about multiple subjects',
  interfaces: [SurveyQuestionInterface],
  fields: () => (Object.assign({},
    CommonSurveyQuestionFields,
    {
      subject: {
        type: new GraphQLNonNull(new GraphQLList(PlayerSubject)),
        description: 'The list of ids of the persons or things this question is asking about'
      },
    }
  ))
})

export const SingleSubjectSurveyQuestion = new GraphQLObjectType({
  name: 'SingleSubjectSurveyQuestion',
  description: 'A survey question about a single subject',
  interfaces: [SurveyQuestionInterface],
  fields: () => (Object.assign({},
    CommonSurveyQuestionFields,
    {
      subject: {
        type: new GraphQLNonNull(PlayerSubject),
        description: 'The id of the person or this question is asking about'
      },
    }
  ))
})

export const SurveyQuestion = new GraphQLUnionType({
  name: 'SurveyQuestion',
  types: [SingleSubjectSurveyQuestion, MultiSubjectSurveyQuestion],
  resolveType: resolveSurveyQuestionType,
})

function resolveSurveyQuestionType(value) {
  if (Array.isArray(value.subject)) {
    return MultiSubjectSurveyQuestion
  }
  return SingleSubjectSurveyQuestion
}

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
