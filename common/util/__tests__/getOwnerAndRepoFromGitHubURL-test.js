import test from 'ava'

import getOwnerAndRepoFromGitHubURL from '../getOwnerAndRepoFromGitHubURL'

test('returns object with "owner" and "repo" attributes for valid GitHub repository URL', t => {
  t.plan(2)

  const ghURL = 'https://github.com/LearnersGuild/learning-os-software'
  const {owner, repo} = getOwnerAndRepoFromGitHubURL(ghURL)

  t.is(owner, 'LearnersGuild')
  t.is(repo, 'learning-os-software')
})

test('throws an exception for invalid GitHub repository URL', t => {
  t.plan(2)

  t.throws(() => {
    const ghURL = 'https://github.com/LearnersGuild'
    getOwnerAndRepoFromGitHubURL(ghURL)
  })

  t.throws(() => {
    const ghURL = 'https://google.com/abc/def'
    getOwnerAndRepoFromGitHubURL(ghURL)
  })
})
