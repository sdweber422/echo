import fetch from 'isomorphic-fetch'
import raven from 'raven'

import {getQueue} from '../util'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

const upsertToDatabase = {
  // we use .replace() instead of .insert() in case we get duplicates in the queue
  moderator: gameUser => r.table('moderators').replace(gameUser, {returnChanges: 'always'}).run(),
  player: gameUser => r.table('players').replace(gameUser, {returnChanges: 'always'}).run(),
}

async function addUserToDatabase(user) {
  try {
    if (!user.inviteCode) {
      throw new Error(`user with id ${user.id} has no inviteCode, unable to determine chapter assignment`)
    }
    const chapters = await r.table('chapters').getAll(user.inviteCode, {index: 'inviteCodes'}).run()
    if (chapters.length === 0) {
      throw new Error(`no chapter found for inviteCode ${user.inviteCode} on user with id ${user.id}`)
    }
    const chapter = chapters[0]
    const now = r.now()
    const gameUser = {
      id: user.id,
      chapterId: chapter.id,
      createdAt: now,
      updatedAt: now,
    }
    const gameRoles = ['player', 'moderator']
    const dbInsertPromises = []
    gameRoles.forEach(role => {
      if (user.roles.indexOf(role) >= 0) {
        dbInsertPromises.push(upsertToDatabase[role](gameUser))
      }
    })
    const upsertedUsers = await Promise.all(dbInsertPromises)
      .then(results => results.map(result => result.changes[0].new_val))
      .catch(error => {
        throw new Error(`Unable to insert game user(s): ${error}`)
      })
    return upsertedUsers[0]
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

async function addUserToGitHubChapterTeam(user, gameUser) {
  try {
    const chapter = await r.table('chapters').get(gameUser.chapterId).run()
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

async function processNewGameUser(user) {
  try {
    const gameUser = await addUserToDatabase(user)
    await addUserToGitHubChapterTeam(user, gameUser)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newGameUser = getQueue('newGameUser')
  newGameUser.process(async ({data: user}) => processNewGameUser(user))
}
