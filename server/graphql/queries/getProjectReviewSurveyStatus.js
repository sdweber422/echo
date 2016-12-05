import {GraphQLString, GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import getProjectReviewStatusForPlayer from 'src/server/actions/getProjectReviewStatusForPlayer'
import {ProjectReviewSurveyStatus} from 'src/server/graphql/schemas'

export default {
  type: ProjectReviewSurveyStatus,
  args: {
    projectName: {type: new GraphQLNonNull(GraphQLString)}
  },
  resolve(source, {projectName}, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'getProjectReviewSurveyStatus')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    return getProjectReviewStatusForPlayer(projectName, currentUser.id)
  },
}
