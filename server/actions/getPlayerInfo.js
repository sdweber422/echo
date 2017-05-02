import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'

export default function getPlayerInfo(playerIds) {
  return graphQLFetcher(config.server.idm.baseURL)({
    query: 'query ($playerIds: [ID]!) { getUsersByIds(ids: $playerIds) { id active handle email name roles profileUrl } }',
    variables: {playerIds},
  }).then(result => result ? result.data.getUsersByIds : null)
}
