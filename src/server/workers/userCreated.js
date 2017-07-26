import config from 'src/config'
import {addUserToTeam} from 'src/server/services/gitHubService'
import {logRejection} from 'src/server/util'
import {Chapter, Member} from 'src/server/services/dataService'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userCreated', processUserCreated)
}

export async function processUserCreated(idmUser) {
  try {
    if (!idmUser.inviteCode) {
      throw new Error(`Invalid invite code for user user with id ${idmUser.id}; unable to determine chapter assignment`)
    }

    const chapters = await Chapter.getAll(idmUser.inviteCode, {index: 'inviteCodes'})
    if (chapters.length === 0) {
      throw new Error(`no chapter found with inviteCode ${idmUser.inviteCode} from user with id ${idmUser.id}`)
    }

    const chapter = chapters[0]

    await Member.upsert({
      id: idmUser.id,
      chapterId: chapter.id,
    })

    try {
      await _addUserToChapterGitHubTeam(idmUser.handle, chapter.githubTeamId)
    } catch (err) {
      console.error(`Unable to add member ${idmUser.id} to github team ${chapter.githubTeamId}: ${err}`)
    }

    // TODO: move to IDM service
    try {
      await _notifyCRMSystemOfMemberSignUp(idmUser)
    } catch (err) {
      console.error(`Unable to notify CRM of member signup for user ${idmUser.id}: ${err}`)
    }
  } catch (err) {
    throw new Error(`Unable to save user updates ${idmUser.id}: ${err}`)
  }
}

function _notifyCRMSystemOfMemberSignUp(idmUser) {
  const crmService = require('src/server/services/crmService')
  return config.server.crm.enabled === true ?
    logRejection(crmService.notifyContactSignedUp(idmUser.email), 'Error while contacting CRM System.') :
    Promise.resolve()
}

async function _addUserToChapterGitHubTeam(userHandle, githubTeamId) {
  console.log(`Adding ${userHandle} to GitHub team ${githubTeamId}`)
  return logRejection(addUserToTeam(userHandle, githubTeamId), 'Error while adding user to chapter GitHub team.')
}
