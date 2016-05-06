import fetch from 'isomorphic-fetch'
import raven from 'raven'
import url from 'url'

import r from '../../db/connect'
import {getQueue} from '../util'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

function fetchGoalInfo(goalURL) {
  const fetchOpts = {
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
  }
  const issueURL = `https://api.github.com/repos${url.parse(goalURL).path}`
  return fetch(issueURL, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        // if the goal URL is invalid, return null so that we can notify the user of the error later
        if (resp.status === 404) {
          return null
        }
        const respBody = resp.body.read()
        const errMessage = respBody ? JSON.parse(respBody.toString()) : `FAILED: ${issueURL}`
        console.error(errMessage)
        throw new Error(`${errMessage}\n${resp.statusText}`)
      }
      return resp.json()
    })
    // if the goal URL is invalid, return null so that we can notify the user of the error later
    .then(githubIssue => ({
      url: goalURL,
      title: githubIssue ? githubIssue.title : null,
      githubIssue,
    }))
}

function fetchGoalsInfo(vote) {
  return Promise.all(vote.goals.map(goal => fetchGoalInfo(goal.url)))
}

function removeInvalidGoalsAndReportErrors(vote) {
  // TODO: push a notification to the user with invalid goals
  // const invalidGoals = vote.goals.filter(goal => goal.githubIssue === null)
  vote.goals = vote.goals.filter(goal => goal.githubIssue !== null)
  return vote
}

function updateOrDeleteVote(vote) {
  const savedVote = r.table('votes').get(vote.id)
  // a vote without goals is no vote at all, so we'll delete it
  if (vote.goals.length === 0) {
    // TODO: push a notification to the user informing them of the deleted vote
    return savedVote.delete().run()
  }
  // otherwise, update the vote
  const newVote = Object.assign({}, vote, {updatedAt: r.now()})
  return savedVote.update(newVote).run()
}

function pushCandidateGoalsForCycle(vote) {
  return r.table('votes')
    .getAll(vote.cycleId, {index: 'cycleId'})
    .group(r.row('goals').pluck('url', 'title'), {multi: true})
    .ungroup()
    .map(doc => {
      return {
        goal: doc('group'),
        votes: doc('reduction').map(vote => {
          return {
            playerId: vote('playerId'),
            rank: vote('goals')('url').offsetsOf(doc('group')('url')).nth(0)
          }
        })
      }
    })
    .run()
    .then(candidateGoalsResult => {
      // TODO: push result through web socket for this cycle
      console.log('TODO (via websocket to UI):', candidateGoalsResult)
    })
}

async function processVote(vote) {
  try {
    vote.goals = await fetchGoalsInfo(vote)
    const validatedVote = removeInvalidGoalsAndReportErrors(vote)
    await updateOrDeleteVote(validatedVote)
    pushCandidateGoalsForCycle(validatedVote)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
  }
}

export function start() {
  const newOrUpdatedVote = getQueue('newOrUpdatedVote')
  newOrUpdatedVote.process(async ({data: vote}) => processVote(vote))
}
