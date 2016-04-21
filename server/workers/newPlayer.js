import fetch from 'isomorphic-fetch'
import raven from 'raven'

import {getQueue} from '../util'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

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
    const savedPlayer = await r.table('players').insert(player, {returnChanges: 'always'}).run()
    if (savedPlayer.inserted) {
      return savedPlayer.changes[0].new_val
    }
    throw new Error(`Unable to save player: ${player}`)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

async function addPlayerToGitHubChapterTeam(user, player) {
  try {
    const chapter = await r.table('chapters').get(player.chapterId).run()
    const fetchOpts = {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
        Accept: 'application/json',
      },
    }
    console.log(`Adding ${user.handle} to GitHub team ${chapter.channelName} (${chapter.githubTeamId})`)
    const addToTeamURL = `https://api.github.com/teams/${chapter.githubTeamId}/memberships/${user.handle}`
    return fetch(addToTeamURL, fetchOpts)
      .then(resp => {
        if (!resp.ok) {
          const respBody = resp.body.read()
          const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${addToTeamURL}`
          console.error(errMessage)
          throw new Error(`${errMessage}\n${resp.statusText}`)
        }
        return resp.json()
      })
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

async function processNewPlayer(user) {
  try {
    const player = await addPlayerToDatabase(user)
    await addPlayerToGitHubChapterTeam(user, player)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newPlayer = getQueue('newPlayer')
  newPlayer.process(async ({data: user}) => processNewPlayer(user))
}
