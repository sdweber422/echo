import raven from 'raven'

import {getQueue} from '../util'
import r from '../../db/connect'

async function addPlayerToDatabase(user) {
  try {
    if (!user.inviteCode) {
      throw new Error(`user with id ${user.id} has no inviteCode`)
    }
    const chapters = await r.table('chapters').getAll(user.inviteCode, {index: 'inviteCodes'}).run()
    if (chapters.length === 0) {
      throw new Error(`no chapter found for inviteCode ${user.inviteCode} on user with id ${user.id}`)
    }
    const chapter = chapters[0]
    const now = r.now()
    const player = {
      id: user.id,
      chapterId: chapter.id,
      createdAt: now,
      updatedAt: now,
    }
    const savedPlayer = await r.table('players').insert(player).run()
    if (savedPlayer.inserted) {
      return savedPlayer.changes[0].new_val
    }
    throw new Error(`Unable to save player: ${player}`)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

async function addPlayerToGitHubChapterTeam(player) {
  try {
    console.log('saved player:', player)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

async function processNewPlayer(user) {
  try {
    const player = await addPlayerToDatabase(user)
    addPlayerToGitHubChapterTeam(player)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)
  const newPlayer = getQueue('newPlayer')
  newPlayer.process(async ({data: user}) => processNewPlayer(user))
}
