import fetch from './fetch'

const defaultIdmFields = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default async function findUsers(identifiers, options) {
  const {idmFields = defaultIdmFields} = options || {}

  if (Array.isArray(identifiers) && identifiers.length === 0) {
    return []
  }

  const fields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields
  const query = `query ($identifiers: [String]) {findUsers(identifiers: $identifiers) {${fields}}}`
  const variables = {identifiers}

  const result = await fetch({query, variables})
  return result && result.data ? result.data.findUsers : []
}
