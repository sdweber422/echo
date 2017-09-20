import fetch from './fetch'

export default async function reactivateUser(userId) {
  const query = 'mutation ($memberId: ID!) {reactivateUser(id: $memberId) {id active handle}}'
  const variables = {memberId: userId}
  const result = await fetch({query, variables})
  return result && result.data ? result.data.reactivateUser : null
}
