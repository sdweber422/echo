import {GraphQLNonNull, GraphQLString} from 'graphql'

import {userCan} from 'src/common/util'
import {CYCLE_STATES} from 'src/common/models/cycle'
import {getModeratorById} from 'src/server/db/moderator'
import {getCyclesInStateForChapter} from 'src/server/db/cycle'
import updateCycleState from 'src/server/actions/updateCycleState'
import {Cycle} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadInputError, LGForbiddenError} from 'src/server/util/error'

export default {
  type: Cycle,
  args: {
    state: {type: new GraphQLNonNull(GraphQLString)},
  },
  resolve(source, args, {rootValue: {currentUser}}) {
    return changeCycleState(args.state, currentUser)
  }
}

async function changeCycleState(newState, currentUser) {
  const newStateIndex = CYCLE_STATES.indexOf(newState)
  if (!userCan(currentUser, 'updateCycle')) {
    throw new LGNotAuthorizedError()
  }
  if (newStateIndex === -1) {
    throw new LGBadInputError(`Invalid cycle state ${newState}`)
  }
  if (newStateIndex === 0) {
    throw new LGForbiddenError(`You cannot change the cycle state back to ${newState}`)
  }

  const moderator = await getModeratorById(currentUser.id, {mergeChapter: true})
  if (!moderator) {
    throw new LGNotAuthorizedError('You are not a moderator for the game')
  }
  const validOriginState = CYCLE_STATES[newStateIndex - 1]
  const cycles = await getCyclesInStateForChapter(moderator.chapter.id, validOriginState)
  if (!cycles.length > 0) {
    throw new LGForbiddenError(`No cycles for ${moderator.chapter.name} chapter (${moderator.chapter.id}) in ${validOriginState} state`)
  }

  return updateCycleState(cycles[0], newState)
}
