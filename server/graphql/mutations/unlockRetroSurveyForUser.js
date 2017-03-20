import {GraphQLNonNull, GraphQLID} from 'graphql'
import {unlockRetroSurveyForUser} from 'src/server/actions/retroSurveyLockUnlock'
import userCan from 'src/common/util/userCan'
import {Project} from 'src/server/services/dataService/models'
import {LGNotAuthorizedError} from 'src/server/util/error'

import {ProjectSummary} from 'src/server/graphql/schemas'

export default {
  type: ProjectSummary,
  args: {
    playerId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The playerId of the player whose survey should be unlocked',
    },
    projectId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The projects id of the survey to unlock for this given player',
    },
  },
  async resolve(source, {playerId, projectId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'lockAndUnlockSurveys')) {
      throw new LGNotAuthorizedError()
    }

    await unlockRetroSurveyForUser(playerId, projectId)
    return {
      project: await Project.get(projectId)
    }
  }
}
