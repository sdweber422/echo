import {getLatestCycleForChapter} from 'src/server/db/cycle'
import {getPlayerById} from 'src/server/db/player'
import {LGForbiddenError} from 'src/server/util/error'

export default async function assertPlayersCurrentCycleInState(currentUser, state) {
  const player = await getPlayerById(currentUser.id, {mergeChapter: true})
  const cycleInReflection = await getLatestCycleForChapter(player.chapter.id)('state').eq(state)

  if (!cycleInReflection) {
    throw new LGForbiddenError(`This action is not allowed when the cycle is not in the ${state} state`)
  }
}
