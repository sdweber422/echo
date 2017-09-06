import {getUsersByHandles as idmGetUsersByHandles} from 'src/server/services/idmService'

export default function getUsersByHandles(userHandles) {
  return idmGetUsersByHandles(userHandles)
}
