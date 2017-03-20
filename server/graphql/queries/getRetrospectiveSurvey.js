import {GraphQLString} from 'graphql'

import {userCan} from 'src/common/util'
import {getProjectByName} from 'src/server/db/project'
import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Survey} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: Survey,
  args: {
    projectName: {
      type: GraphQLString,
      description: 'The name of the project whose retrospective survey should be returned. Required if the current user is in more than one project this cycle.'
    }
  },
  async resolve(source, {projectName}, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
      throw new LGNotAuthorizedError()
    }

    const projectId = projectName ? await getProjectByName(projectName)('id') : undefined

    return compileSurveyDataForPlayer(currentUser.id, projectId)
  },
}
