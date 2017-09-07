import fetch from './fetch'

export default async function getUsersByIds(memberIds) {
  const query = 'query ($ids: [ID]!) {getUsersByIds(ids: $ids) {id active handle email name roles profileUrl}}'
  const variables = {ids: memberIds}
  const result = await fetch({query, variables})
  return result && result.data ? result.data.getUsersByIds : null
}
