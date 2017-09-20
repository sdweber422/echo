export default function addCollaboratorToApps(user, apps) {
  const herokuService = require('src/server/services/herokuService')
  return Promise.all(
    apps.map(app => herokuService.addCollaboratorToApp(user, app))
  )
}
