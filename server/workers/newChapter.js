import fetch from 'isomorphic-fetch'
import raven from 'raven'

import r from '../../db/connect'
import {getOwnerAndRepoFromGitHubURL} from '../../common/util'
import {getQueue} from '../util'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

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
  console.log(`Creating GitHub team ${body.name} for chapter ${chapter.id}`)
  const createTeamURL = `https://api.github.com/orgs/${owner}/teams`
  return fetch(createTeamURL, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        const respBody = resp.body.read()
        const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${createTeamURL}`
        console.error(errMessage)
        throw new Error(`${errMessage}\n${resp.statusText}`)
      }
      return resp.json()
    })
}

async function addTeamIdToChapter(chapter, team) {
  try {
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

async function processNewChapter(chapter) {
  try {
    const team = await createGitHubTeamWithAccessToGoalRepo(chapter)
    await addTeamIdToChapter(chapter, team)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newChapter = getQueue('newChapter')
  newChapter.process(async ({data: chapter}) => processNewChapter(chapter))
}
