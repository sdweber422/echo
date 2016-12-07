import nock from 'nock'

import config from 'src/config'
import factory from 'src/test/factories'

export async function mockIdmUsersById(userIds, overwriteObjs = null) {
  const overwriteObjectAttributes = overwriteObjs ? overwriteObjs : userIds.map(id => ({id}))
  const idmUsers = await factory.buildMany('user', overwriteObjectAttributes)
  nock(config.server.idm.baseURL)
    .post('/graphql')
    .reply(200, JSON.stringify({data: {getUsersByIds: idmUsers}}))
}
