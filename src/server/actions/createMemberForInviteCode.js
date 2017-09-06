import {Chapter, Member} from 'src/server/services/dataService'

export default async function createMemberForInviteCode(userId, inviteCode) {
  if (!inviteCode) {
    throw new Error(`Invalid invite code for user user with id ${userId}; unable to determine chapter assignment`)
  }

  const chapter = (await Chapter.getAll(inviteCode, {index: 'inviteCodes'}))[0]
  if (!chapter) {
    throw new Error(`no chapter found with inviteCode ${inviteCode} from user with id ${userId}`)
  }

  return Member.save({
    id: userId,
    chapterId: chapter.id,
  })
}
