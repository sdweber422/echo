export const AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR'

export default function authorizationError(error) {
  return {type: AUTHORIZATION_ERROR, error}
}
