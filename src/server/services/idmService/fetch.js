import config from 'src/config'
import graphQLFetcher from 'src/server/util/graphql'

export default function fetch(graphQLQuery) {
  return graphQLFetcher(config.server.idm.baseURL)(graphQLQuery)
}
