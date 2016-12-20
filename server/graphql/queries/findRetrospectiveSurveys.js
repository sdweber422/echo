import {GraphQLList} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import findRetroSurveysForPlayer from 'src/server/actions/findRetroSurveysForPlayer'
import {Survey} from 'src/server/graphql/schemas'

export default {
  type: new GraphQLList(Survey),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'findRetrospectiveSurveys')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    return findRetroSurveysForPlayer(currentUser.id)
  },
}
