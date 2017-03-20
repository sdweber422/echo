import {GraphQLString, GraphQLNonNull} from 'graphql'

import {userCan} from 'src/common/util'
import getProjectReviewStatusForPlayer from 'src/server/actions/getProjectReviewStatusForPlayer'
import {ProjectReviewSurveyStatus} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: ProjectReviewSurveyStatus,
  args: {
    projectName: {type: new GraphQLNonNull(GraphQLString)}
  },
  resolve(source, {projectName}, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'getProjectReviewSurveyStatus')) {
      throw new LGNotAuthorizedError()
    }

    return getProjectReviewStatusForPlayer(projectName, currentUser.id)
  },
}
