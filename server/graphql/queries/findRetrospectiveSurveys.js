import {GraphQLList} from 'graphql'

import {userCan} from 'src/common/util'
import findOpenRetroSurveysForPlayer from 'src/server/actions/findOpenRetroSurveysForPlayer'
import {Survey} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError} from 'src/server/util/error'

export default {
  type: new GraphQLList(Survey),
  async resolve(source, args, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'findRetrospectiveSurveys')) {
      throw new LGNotAuthorizedError()
    }

    return findOpenRetroSurveysForPlayer(currentUser.id)
  },
}
