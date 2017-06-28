import {BACKOFFICE, PLAYER, MODERATOR, SEP, SYSADMIN} from 'src/common/models/user'

const GENERAL_USE = [
  MODERATOR,
  PLAYER,
]

const ECHO_VIEW = GENERAL_USE.concat([BACKOFFICE])

const CAPABILITY_ROLES = {
  listChapters: [BACKOFFICE],
  findChapters: [BACKOFFICE],
  createChapter: [BACKOFFICE],
  updateChapter: [BACKOFFICE],
  createInviteCode: [BACKOFFICE],
  reassignPlayersToChapter: [BACKOFFICE],

  createCycle: [MODERATOR],
  launchCycle: [MODERATOR],
  updateCycle: [MODERATOR],
  deleteProject: [MODERATOR],
  viewCycleVotingResults: GENERAL_USE,

  updateUser: [SEP, MODERATOR],
  importProject: [MODERATOR],
  updateProject: [MODERATOR],
  listProjects: ECHO_VIEW,
  findProjects: ECHO_VIEW,
  viewProject: ECHO_VIEW,
  viewProjectSummary: ECHO_VIEW,
  viewProjectUserSummary: [MODERATOR, BACKOFFICE],
  setProjectArtifact: GENERAL_USE,

  viewUser: ECHO_VIEW,
  viewUserFeedback: [MODERATOR, BACKOFFICE],
  viewUserSummary: ECHO_VIEW,
  listUsers: ECHO_VIEW,
  findUsers: ECHO_VIEW,
  deactivateUser: [MODERATOR, BACKOFFICE],

  saveResponse: GENERAL_USE,
  getRetrospectiveSurvey: GENERAL_USE,
  findRetrospectiveSurveys: GENERAL_USE,
  lockAndUnlockSurveys: [MODERATOR],

  viewSensitiveReports: [MODERATOR, SYSADMIN],
  monitorJobQueues: [SYSADMIN],
  beExcludedFromVoting: [MODERATOR],
}

export const VALID_ROLES = Object.keys(CAPABILITY_ROLES).map(capability => {
  return CAPABILITY_ROLES[capability]
}).reduce((prev, curr) => {
  return [...new Set(prev.concat(curr))]
}, [])

export default function userCan(currentUser, capability) {
  if (!currentUser) {
    return false
  }
  const {roles} = currentUser
  if (!roles) {
    return false
  }
  if (!CAPABILITY_ROLES[capability]) {
    throw new Error(`No such capability '${capability}'`)
  }
  const permitted = roles.filter(role => (
    CAPABILITY_ROLES[capability].indexOf(role) >= 0
  )).length > 0

  return permitted
}
