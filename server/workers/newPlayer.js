import raven from 'raven'

import {getQueue} from '../util'
import r from '../../db/connect'

export function start() {
  const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)
  const newPlayer = getQueue('newPlayer')
  newPlayer.process(async ({data: user}) => {
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
      return r.table('players').insert(player).run()
    } catch (err) {
      console.error(err.stack)
      sentry.captureException(err)
    }
  })
}
