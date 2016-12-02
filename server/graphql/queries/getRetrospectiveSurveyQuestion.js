import {GraphQLInt, GraphQLString, GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {getProjectByName} from 'src/server/db/project'
import {compileSurveyQuestionDataForPlayer} from 'src/server/actions/compileSurveyData'
import {SurveyQuestion} from 'src/server/graphql/schemas'
import {handleError} from 'src/server/graphql/util'

export default {
  type: SurveyQuestion,
  args: {
    questionNumber: {
      type: new GraphQLNonNull(GraphQLInt)
    },
    projectName: {
      type: GraphQLString,
      description: 'The name of the project whose retrospective survey question should be returned. Required if the current user is in more than one project this cycle.'
    }
  },
  async resolve(source, {questionNumber, projectName}, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const projectId = projectName ? await getProjectByName(projectName)('id') : undefined

    return compileSurveyQuestionDataForPlayer(currentUser.id, questionNumber, projectId)
      .catch(handleError)
  },
}
