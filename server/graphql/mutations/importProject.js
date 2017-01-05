import {GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import importProject from 'src/server/actions/importProject'
import {Project, ProjectImport} from 'src/server/graphql/schemas'

export default {
  type: Project,
  args: {
    values: {type: new GraphQLNonNull(ProjectImport)},
  },
  async resolve(source, {values}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'importProject')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    return await importProject(values)
  }
}
