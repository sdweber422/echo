import nock from 'nock'

import config from 'src/config'
import factory from 'src/test/factories'

export async function mockIdmUsersById(userIds) {
  const idmUsers = await Promise.all(userIds.map(id => factory.build('user', {id})))
  nock(config.server.idm.baseURL)
    .post('/graphql')
    .reply(200, JSON.stringify({data: {getUsersByIds: idmUsers}}))
}
