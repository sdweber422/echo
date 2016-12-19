import Promise from 'bluebird'
import {GraphQLList} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import findActiveProjectsForPlayer from 'src/server/actions/findActiveProjectsForPlayer'
import {compileSurveyDataForPlayer} from 'src/server/actions/compileSurveyData'
import {Survey} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLList(Survey),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'findRetrospectiveSurveys')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    const openProjects = findActiveProjectsForPlayer(currentUser.id)

    return Promise.mapSeries(openProjects, project => (
      compileSurveyDataForPlayer(currentUser.id, project.id)
    ))
  },
}
