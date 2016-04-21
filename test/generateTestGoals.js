import faker from 'faker'
import fetch from 'isomorphic-fetch'

import {getOwnerAndRepoFromGitHubURL} from '../common/util'


function generateGoal() {
  const title = faker.lorem.words()
  const objectives = Array.from(Array(faker.random.number({min: 3, max: 7})).keys())
    .map(() => `- [ ] ${faker.lorem.sentence()}`)
  const body = `# ${title}

## Description

${faker.lorem.paragraphs(2, '\n\n')}

## Context

${faker.lorem.paragraphs(2, '\n\n')}

## Objectives

${objectives.join('\n')}`

  return {
    title,
    body,
  }
}

function postIssue(owner, repo, issue) {
  const fetchOpts = {
    method: 'POST',
    headers: {
      Authorization: `token ${process.env.GITHUB_ORG_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
    body: JSON.stringify(issue),
  }
  return fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, fetchOpts)
    .then(resp => {
      if (!resp.ok) {
        console.error(JSON.parse(resp.body.read().toString()))
        throw new Error(resp.statusText)
      }
      return resp.json()
    })
}

function generate() {
  require('dotenv').load()

  if (!process.env.GITHUB_CRAFTS_REPO || !process.env.GITHUB_ORG_ADMIN_TOKEN) {
    throw new Error('GITHUB_CRAFTS_REPO and GITHUB_ORG_ADMIN_TOKEN must be set in environment!')
  }

  const {owner, repo} = getOwnerAndRepoFromGitHubURL(process.env.GITHUB_CRAFTS_REPO)

  const numGoals = 50
  const ghPromises = Array.from(Array(numGoals).keys()).map(() => postIssue(owner, repo, generateGoal()))
  Promise.all(ghPromises)
    .then(() => console.log(`Created ${numGoals} goal issues in ${process.env.GITHUB_CRAFTS_REPO}`))
    .catch(error => console.error(error.stack))
}

export default generate

if (!module.parent) {
  generate()
}
