import config from 'src/config'
import getUser from 'src/server/actions/getUser'
import {removeUserFromOrganizations} from 'src/server/services/gitHubService'
import {removeCollaboratorFromApps} from 'src/server/services/herokuService'
import {deactivateSlackUser} from 'src/server/services/chatService'
import graphQLFetcher from 'src/server/util/graphql'

const githubOrgs = config.server.github.organizations
const levelPermissions = (config.levels.permissions || {})

export default function deactivateUser(userId) {
  return getUser(userId)
    .then(user => {
      const userLevelPermissions = levelPermissions[user.stats.level] || {}
      const playerHerokuApps = (userLevelPermissions.heroku || {}).apps || []
      return Promise.all([
        removeUserFromOrganizations(user.handle, githubOrgs),
        removeCollaboratorFromApps(user, playerHerokuApps),
        deactivateSlackUser(userId),
        _deactivateUserInIDM(userId),
      ])
      .then(([githubResponse, herokuResponse, slackResponse, idmResponse]) => idmResponse) // eslint-disable-line no-unused-vars
      .catch(err => console.error(err))
    })
}

function _deactivateUserInIDM(userId) {
  const mutation = {
    query: 'mutation ($playerId: ID!) { deactivateUser(id: $playerId) { id active handle } }',
    variables: {playerId: userId},
  }
  return graphQLFetcher(config.server.idm.baseURL)(mutation)
}
