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

// r.db('game_test').table('surveys').merge(function(survey) {
//   return {
//     questions: survey('questions').map(function(q) {
//       return r.db('game_test').table('questions').get(q('questionId')).merge(function() {
//         return { subject: q('subject') }
//       })
//     })
//   }
// })
//
//
// {
// "createdAt": Mon Jun 06 2016 15:13:25 GMT+00:00 ,
// "cycleId":  "72479219-c92d-462c-ab7d-6565e82af995" ,
// "id":  "5516fc83-0069-4b2b-88ea-edfc08f9f54b" ,
// "projectId":  "a33677fd-89d9-4f0a-ad22-6377ff49b8d7" ,
// "questions": [
//   {
//     "active": true ,
//     "createdAt": Mon Jun 06 2016 15:13:25 GMT+00:00 ,
//     "id":  "80088467-2fd3-4346-83f2-f5fa11efd99f" ,
//     "prompt":  "How much did each team member contribute this cycle?" ,
//     "subject": [
//       "26bc3d2d-b0bc-4c8a-afa8-22ac4a2adbed" ,
//       "17352c23-5706-41a4-a42e-0a99bc81fed9" ,
//       "6855fa00-5b58-4e0e-ad83-82115e55780a" ,
//       "bd6172a7-ca4a-4695-a5fc-501a36620b1e"
//     ] ,
//     "subjectType":  "team" ,
//     "type":  "percentage" ,
//     "updatedAt": Mon Jun 06 2016 15:13:25 GMT+00:00
//   }
// ],
// "updatedAt": Mon Jun 06 2016 15:13:25 GMT+00:00
// }
