import createMemberForInviteCode from 'src/server/actions/createMemberForInviteCode'
import {logRejection} from 'src/server/util'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userInviteCodeUsed', processUserInviteCodeUsed)
}

export async function processUserInviteCodeUsed(user) {
  const {Chapter} = require('src/server/services/dataService')

  try {
    const member = await createMemberForInviteCode(user.id, user.inviteCode)

    const {githubTeamId} = await Chapter.get(member.chapterId)
    if (!githubTeamId) {
      throw new Error(`No githubTeamId found for chapter with chapterId ${member.chapterId}`)
    }

    try {
      await _addUserToChapterGitHubTeam(user.handle, githubTeamId)
    } catch (err) {
      console.error(`Unable to add member ${user.id} to github team ${githubTeamId}: ${err}`)
    }
  } catch (err) {
    throw new Error(`Unable to save user updates ${user.id}: ${err}`)
  }
}

async function _addUserToChapterGitHubTeam(handle, githubTeamId) {
  const {addUserToTeam} = require('src/server/services/gitHubService')

  console.log(`Adding ${handle} to GitHub team ${githubTeamId}`)
  return logRejection(addUserToTeam(handle, githubTeamId), 'Error while adding user to chapter GitHub team.')
}
