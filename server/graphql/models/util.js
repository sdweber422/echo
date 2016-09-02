import raven from 'raven'
import {GraphQLError} from 'graphql/error'

import config from 'src/config'
import {parseQueryError} from 'src/server/db/errors'
import {getPlayerById} from 'src/server/db/player'
import {getLatestCycleForChapter} from 'src/server/db/cycle'

const sentry = new raven.Client(config.server.sentryDSN)

export async function assertPlayersCurrentCycleInState(currentUser, state) {
  const player = await getPlayerById(currentUser.id, {mergeChapter: true})
  const cycleInReflection = await getLatestCycleForChapter(player.chapter.id)('state')
    .eq(state)

  if (!cycleInReflection) {
    throw new GraphQLError(`This action is not allowed when the cycle is not in the ${state} state`)
  }
}

export function handleError(unparsedError, defaultMsg) {
  const err = parseQueryError(unparsedError)
  if (err.name === 'BadInputError' || err.name === 'LGCustomQueryError') {
    throw err
  }
  console.error(err.stack || err)
  sentry.captureException(err)
  throw new GraphQLError(defaultMsg || err.message || err)
}
