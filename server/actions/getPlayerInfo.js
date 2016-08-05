import {graphQLFetcher} from '../util'

export default function getPlayerInfo(playerIds) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: 'query ($playerIds: [ID]!) { getUsersByIds(ids: $playerIds) { id handle name } }',
    variables: {playerIds},
  }).then(result => result.data.getUsersByIds)
}
