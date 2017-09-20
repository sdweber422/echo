import config from 'src/config'
import getUser from 'src/server/actions/getUser'
import {Chapter} from 'src/server/services/dataService'
import {addUserToTeam as addUserToGitHubTeam} from 'src/server/services/gitHubService'
import {addCollaboratorToApps} from 'src/server/services/herokuService'
import {reactivateUser as reactivateChatUser} from 'src/server/services/chatService'
import {reactivateUser as reactivateIDMUser} from 'src/server/services/idmService'
import {logRejection} from 'src/server/util'

const losPermissions = (config.losPermissions || {})

export default async function reactivateUser(userId) {
  const user = await getUser(userId)
  const memberHerokuApps = (losPermissions.heroku || {}).apps || []
  const chapter = await Chapter.get(user.chapterId)
  await logRejection(addUserToGitHubTeam(user.handle, chapter.githubTeamId), 'Error while adding user to GitHub.')
  await logRejection(addCollaboratorToApps(user, memberHerokuApps), 'Error while adding user to Heroku apps.')
  await logRejection(reactivateChatUser(userId), 'Error while reactivating user in the chat system.')

  return reactivateIDMUser(userId)
}
