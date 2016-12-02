import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLURL} from 'graphql-custom-types'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {update as updateProject, findProjectByNameForPlayer} from 'src/server/db/project'
import {handleError} from 'src/server/graphql/util'
import {Project} from 'src/server/graphql/schemas'

export default {
  type: Project,
  args: {
    projectName: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLURL)},
  },
  async resolve(source, {projectName, url}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'updateProject')) {
      throw new GraphQLError('You are not authorized to do that.')
    }
    try {
      const project = await findProjectByNameForPlayer(projectName, currentUser.id)
      project.artifactURL = url
      const result = await updateProject(project, {returnChanges: true})
      if (result.replaced) {
        return result.changes[0].new_val
      }
      throw new GraphQLError('Failed to update project artifactURL')
    } catch (err) {
      handleError(err)
    }
  }
}
