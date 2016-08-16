import nock from 'nock'

import factory from 'src/test/factories'

export async function mockIdmUsersById(userIds) {
  const idmUsers = await Promise.all(userIds.map(id => factory.build('user', {id})))
  nock(process.env.IDM_BASE_URL)
    .post('/graphql')
    .reply(200, JSON.stringify({data: {getUsersByIds: idmUsers}}))
}
