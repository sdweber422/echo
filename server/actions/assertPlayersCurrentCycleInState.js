import {Player, getLatestCycleForChapter} from 'src/server/services/dataService'
import {LGForbiddenError} from 'src/server/util/error'

export default async function assertPlayersCurrentCycleInState(currentUser, state) {
  const player = await Player.get(currentUser.id).getJoin({chapter: true})
  const cycleInReflection = await getLatestCycleForChapter(player.chapter.id)('state').eq(state)
  if (!cycleInReflection) {
    throw new LGForbiddenError(`This action is not allowed when the cycle is not in the ${state} state`)
  }
}
