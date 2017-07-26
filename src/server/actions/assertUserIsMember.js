import {Member, errors} from 'src/server/services/dataService'
import {LGNotAuthorizedError, LGForbiddenError} from 'src/server/util/error'

export default function assertUserIsMember(userId) {
  return Member.get(userId)
    .then(member => {
      if (!member.chapterId) {
        throw new LGForbiddenError('Members must be assigned to a chapter')
      }
      return member
    })
    .catch(errors.DocumentNotFound, () => {
      throw new LGNotAuthorizedError('Must be a member of a chapter')
    })
}
