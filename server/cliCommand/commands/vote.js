import config from 'src/config'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {
  Player,
  Vote,
  getCyclesInStateForChapter,
  getPoolByCycleIdAndPlayerId,
} from 'src/server/services/dataService'
import {
  LGNotAuthorizedError,
  LGBadRequestError,
  LGForbiddenError,
} from 'src/server/util/error'

async function _voteForGoals(user, goalDescriptors, responseURL) {
  if (!user) {
    throw new LGNotAuthorizedError()
  }

  const player = await Player.get(user.id).getJoin({chapter: true, phase: true})
  if (!player) {
    throw new LGNotAuthorizedError('You must be a member to vote.')
  }

  if (goalDescriptors.length > 1 && goalDescriptors[0] === goalDescriptors[1]) {
    throw new LGBadRequestError('You cannot vote for the same goal twice.')
  }

  const cycles = await getCyclesInStateForChapter(player.chapter.id, GOAL_SELECTION)
  if (!cycles.length > 0) {
    throw new LGForbiddenError(`No cycles for ${player.chapter.name} chapter (${player.chapter.id}) in ${GOAL_SELECTION} state.`)
  }

  if (!player.phase || player.phase.hasVoting === false) {
    throw new LGForbiddenError('Vote blocked; you must be in a Phase with voting enabled')
  }

  const cycle = cycles[0]
  const pool = await getPoolByCycleIdAndPlayerId(cycle.id, player.id)
  const previousVotes = await Vote.getAll([player.id, pool.id], {index: 'playerIdAndPoolId'})

  const voteValues = {
    notYetValidatedGoalDescriptors: goalDescriptors,
    pendingValidation: true,
    responseURL,
  }
  const savedVote = previousVotes[0] ?
    await Vote.get(previousVotes[0].id).updateWithTimestamp(voteValues) :
    await Vote.save({
      ...voteValues,
      playerId: player.id,
      poolId: pool.id,
    })

  return {...savedVote, player, cycle}
}

export async function invoke(args, {user, responseURL}) {
  const attachments = []
  if (args._.length > 0) {
    await _voteForGoals(user, args._, responseURL)
    attachments.push({text: `You voted for: ${args._.join(', ')}.`})
  }

  return {
    text: `Click to see <${config.app.baseURL}/cycle-voting-results|current cycle voting results>.`,
    attachments,
  }
}
