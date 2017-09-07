import {getUsersByIds} from 'src/server/services/idmService'

export default async function getMemberInfo(memberIds) {
  return getUsersByIds(memberIds)
}
