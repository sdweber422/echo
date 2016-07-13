import fetch from 'isomorphic-fetch'
import parseLinkHeader from 'parse-link-header'
import raven from 'raven'

import r from '../../db/connect'
import ChatClient from '../../server/clients/ChatClient'
import {getOwnerAndRepoFromGitHubURL} from '../../common/util'
import {getQueue} from '../util'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

function recursiveFetchAndSelect(url, select) {
  const fetchOpts = {
    method: 'GET',
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
  }
  return fetch(url, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        const respBody = resp.body.read()
        const parsedResponse = respBody && JSON.parse(respBody.toString())
        const errMessage = parsedResponse ? parsedResponse : `FAILED: ${url}`
        console.error(errMessage)
        throw new Error(`${errMessage} (${resp.statusText})`)
      }
      return resp.json()
        .then(results => {
          const found = select(results)
          if (!found) {
            const {next} = parseLinkHeader(resp.headers.get('Link'))
            if (next) {
              return recursiveFetchAndSelect(next.url, select)
            }
            throw new Error('All pages exhausted before selecting matching result.')
          }
          return found
        })
    })
}

function getGitHubTeam(owner, name) {
  console.log(`Fetching GitHub team for ${owner}/${name}`)
  const getTeamsURL = `https://api.github.com/orgs/${owner}/teams`
  return recursiveFetchAndSelect(getTeamsURL, teams => teams.filter(team => team.name === name)[0])
}

const GITHUB_ALREADY_EXISTS_ERROR_CODE = 'already_exists'
function isTeamAlreadyExistsError(ghResponse) {
  return (
    ghResponse &&
    ghResponse.errors &&
    ghResponse.errors.reduce((shouldIgnore, currentError) => {
      return shouldIgnore && (currentError.code === GITHUB_ALREADY_EXISTS_ERROR_CODE)
    }, true)
  )
}

function createGitHubTeamWithAccessToGoalRepo(chapter) {
  const {owner, repo} = getOwnerAndRepoFromGitHubURL(chapter.goalRepositoryURL)
  const body = {
    name: chapter.channelName,
    description: chapter.name,
    /* eslint-disable camelcase */
    repo_names: [`${owner}/${repo}`],
  }
  const fetchOpts = {
    method: 'POST',
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  }
  console.log(`Creating GitHub team ${owner}/${body.name}`)
  const createTeamURL = `https://api.github.com/orgs/${owner}/teams`
  return fetch(createTeamURL, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        const respBody = resp.body.read()
        const parsedResponse = respBody && JSON.parse(respBody.toString())
        if (!isTeamAlreadyExistsError(parsedResponse)) {
          const errMessage = parsedResponse ? parsedResponse : `FAILED: ${createTeamURL}`
          console.error(errMessage)
          throw new Error(`${errMessage} (${resp.statusText})`)
        }
        console.log(`GitHub team ${owner}/${body.name} already exists`)
        return getGitHubTeam(owner, body.name)
      }
      return resp.json()
    })
}

async function addTeamIdToChapter(chapter, team) {
  try {
    console.log(`Adding GitHub team id (${team.id}) to chapter (${chapter.id})`)
    const savedChapter = await r.table('chapters')
      .get(chapter.id)
      .update({githubTeamId: team.id}, {returnChanges: 'always'})
      .run()
    if (savedChapter.replaced) {
      return savedChapter.changes[0].new_val
    }
    throw new Error(`Unable to add GitHub team id (${team.id}) to chapter (${chapter.id})`)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

async function createChapterChannel(chapter) {
  console.log(`Creating chapter channel ${chapter.channelName}`)
  const client = new ChatClient()
  await client.createChannel(chapter.channelName, ['echo'], `${chapter.name}`)
}

async function processNewChapter(chapter) {
  try {
    await createChapterChannel(chapter)
    const team = await createGitHubTeamWithAccessToGoalRepo(chapter)
    await addTeamIdToChapter(chapter, team)
  } catch (err) {
    sentry.captureException(err)
  }
}

export function start() {
  const newChapter = getQueue('newChapter')
  newChapter.process(async ({data: chapter}) => processNewChapter(chapter))
}
