import {GraphQLEnumType} from 'graphql/type'

import {QUESTION_SUBJECT_TYPES} from 'src/common/models/survey'

export default new GraphQLEnumType({
  name: 'SubjectTypeEnum',
  values: {
    [QUESTION_SUBJECT_TYPES.TEAM]: {description: 'A team (player) members as the subject'},
    [QUESTION_SUBJECT_TYPES.PLAYER]: {description: 'A (player) member of the team about the subject'},
    [QUESTION_SUBJECT_TYPES.COACH]: {description: 'The coach assigned to the project as the question subject'},
    [QUESTION_SUBJECT_TYPES.PROJECT]: {description: 'The project itself as the subject'},
  }
})
