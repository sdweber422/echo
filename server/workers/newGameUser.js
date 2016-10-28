import fetch from 'isomorphic-fetch'
import raven from 'raven'

import config from 'src/config'
import {connect} from 'src/db'
import {getQueue} from 'src/server/util'
import {notifyContactSignedUp} from 'src/server/clients/CRMClient'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

const upsertToDatabase = {
  // we use .replace() instead of .insert() in case we get duplicates in the queue
  moderator: gameUser => r.table('moderators').get(gameUser.id).replace(gameUser, {returnChanges: 'always'}).run(),
  player: gameUser => r.table('players').get(gameUser.id).replace(gameUser, {returnChanges: 'always'}).run(),
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
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    const gameRoles = ['player', 'moderator']
    const dbInsertPromises = []
    gameRoles.forEach(role => {
      if (_userHasRole(user, role)) {
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
        Authorization: `token ${config.server.github.tokens.admin}`,
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

function notifyCRMSystemOfPlayerSignUp(user) {
  if (config.server.crm.enabled !== true) {
    return Promise.resolve()
  }
  if (!_userHasRole(user, 'player')) {
    return Promise.resolve()
  }
  return notifyContactSignedUp(user.email)
}

async function processNewGameUser(user) {
  try {
    const gameUser = await addUserToDatabase(user)
    await addUserToGitHubChapterTeam(user, gameUser)
    await notifyCRMSystemOfPlayerSignUp(user)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newGameUser = getQueue('newGameUser')
  newGameUser.process(async ({data: user}) => processNewGameUser(user))
}

function _userHasRole(user, role) {
  if (!user.roles || !Array.isArray(user.roles)) {
    return false
  }
  return user.roles.indexOf(role) >= 0
}
