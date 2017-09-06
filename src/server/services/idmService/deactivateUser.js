import fetch from './fetch'

export default async function deactivateUser(userId) {
  const query = 'mutation ($memberId: ID!) {deactivateUser(id: $memberId) {id active handle}}'
  const variables = {memberId: userId}
  const result = await fetch({query, variables})
  return result && result.data ? result.data.deactivateUser : null
}
