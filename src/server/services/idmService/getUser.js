import fetch from './fetch'

const defaultIdmFields = [
  'id', 'name', 'handle', 'email', 'phone', 'avatarUrl',
  'profileUrl', 'timezone', 'active', 'roles', 'inviteCode'
]

export default async function getUser(identifier, options) {
  const {idmFields = defaultIdmFields} = options || {}

  const queryFields = Array.isArray(idmFields) ? idmFields.join(', ') : idmFields
  const query = `query ($identifier: String!) {getUser(identifier: $identifier) {${queryFields}}}`
  const variables = {identifier}

  const result = await fetch({query, variables})
  return result && result.data ? result.data.getUser : null
}
