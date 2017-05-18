import {GraphQLList} from 'graphql/type'
import {GraphQLNonNull, GraphQLString} from 'graphql'

import getUser from 'src/server/actions/getUser'
import {Project} from 'src/server/services/dataService'
import {Project as ProjectSchema} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(ProjectSchema),
  args: {
    coachIdentifier: {type: new GraphQLNonNull(GraphQLString)}
  },
  async resolve(source, {coachIdentifier}, {rootValue: {currentUser}}) {
    if (!currentUser) {
      throw new LGNotAuthorizedError()
    }

    const coach = await getUser(coachIdentifier)
    return Project.filter({coachId: coach.id})
  }
}
