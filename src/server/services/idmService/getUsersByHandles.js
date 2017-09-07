import fetch from './fetch'

export default async function getUsersByHandles(userHandles) {
  const query = 'query ($handles: [String]!) {getUsersByHandles(handles: $handles) {id handle name email roles}}'
  const variables = {handles: userHandles}
  const result = await fetch({query, variables})
  return result && result.data ? result.data.getUsersByHandles : null
}
