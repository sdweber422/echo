const CAPABILITY_ROLES = {
  createChapter: [
    'backoffice',
  ],
  editChapter: [
    'backoffice',
  ],
  listChapters: [
    'backoffice',
    'moderator',
    'player',
  ],

  createInviteCode: [
    'backoffice',
  ],
  editCycleDuration: [
    'backoffice',
    'moderator',
  ],

  listPlayers: [
    'backoffice',
    'moderator',
    'player',
  ],
  reassignPlayersToChapter: [
    'backoffice',
  ]
}

export default function userCan(currentUser, capability) {
  // console.log('user', currentUser.name, 'can', capability, '?')
  if (!currentUser) {
    // console.log(false)
    return false
  }
  const {roles} = currentUser
  if (!roles) {
    // console.log(false)
    return false
  }
  if (!CAPABILITY_ROLES[capability]) {
    // console.log(false)
    return false
  }
  const permitted = roles.filter(role => (
    CAPABILITY_ROLES[capability].indexOf(role) >= 0
  )).length > 0

  // console.log(permitted)
  return permitted
}
