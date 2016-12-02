import {GraphQLNonNull, GraphQLString} from 'graphql'
import {GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import saveProjectReviewCLISurveyResponsesForPlayer from 'src/server/actions/saveProjectReviewCLISurveyResponsesForPlayer'
import {assertPlayersCurrentCycleInState, handleError} from 'src/server/graphql/util'
import {CreatedIdList, CLINamedSurveyResponse} from 'src/server/graphql/schemas'

export default {
  type: CreatedIdList,
  args: {
    projectName: {
      description: 'The project being reviewed',
      type: new GraphQLNonNull(GraphQLString),
    },
    responses: {
      description: 'A list of responses to save',
      type: new GraphQLNonNull(new GraphQLList(CLINamedSurveyResponse))
    },
  },
  async resolve(source, {responses, projectName}, {rootValue: {currentUser}}) {
    if (!currentUser || !userCan(currentUser, 'saveResponse')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

    const createdIds = await saveProjectReviewCLISurveyResponsesForPlayer(currentUser.id, projectName, responses)
      .catch(err => handleError(err, 'Failed to save responses'))
    return {createdIds}
  }
}
