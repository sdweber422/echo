import {GraphQLNonNull, GraphQLString} from 'graphql'

import {userCan} from 'src/common/util'
import {getProject} from 'src/server/db/project'
import {Project} from 'src/server/services/dataService'
import {Status} from 'src/server/graphql/schemas'
import {LGBadRequestError, LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: Status,
  args: {
    identifier: {type: new GraphQLNonNull(GraphQLString), description: 'The project ID or name'}
  },
  async resolve(source, {identifier}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'deleteProject')) {
      throw new LGNotAuthorizedError('You are not authorized to delete projects.')
    }

    const project = await getProject(identifier)
    if (!project) {
      throw new LGBadRequestError('Project not found')
    }

    await Project.get(project.id).delete()
    return {success: true}
  }
}
