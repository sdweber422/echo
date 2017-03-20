import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLURL} from 'graphql-custom-types'

import {userCan} from 'src/common/util'
import {update as updateProject, findProjectByNameForPlayer} from 'src/server/db/project'
import {Project} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGInternalServerError} from 'src/server/util/error'

export default {
  type: Project,
  args: {
    projectName: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLURL)},
  },
  async resolve(source, {projectName, url}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'setProjectArtifact')) {
      throw new LGNotAuthorizedError()
    }

    const project = await findProjectByNameForPlayer(projectName, currentUser.id)
    project.artifactURL = url

    const result = await updateProject(project, {returnChanges: true})
    if (result.replaced) {
      return result.changes[0].new_val
    }

    throw new LGInternalServerError('Failed to update project artifactURL')
  }
}
