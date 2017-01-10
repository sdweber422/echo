const GAME_PLAY = [
  'moderator',
  'player',
  'coach',
]

const GAME_VIEW = GAME_PLAY.concat(['backoffice'])

const CAPABILITY_ROLES = {
  listChapters: ['backoffice'],
  findChapters: ['backoffice'],
  createChapter: ['backoffice'],
  updateChapter: ['backoffice'],
  createInviteCode: ['backoffice'],
  reassignPlayersToChapter: ['backoffice'],

  createCycle: ['moderator'],
  launchCycle: ['moderator'],
  updateCycle: ['moderator'],
  editCycleDuration: ['moderator'],
  viewCycleVotingResults: GAME_PLAY,

  importProject: ['moderator'],
  updateProject: ['moderator'],
  listProjects: ['moderator', 'coach', 'backoffice'],
  findProjects: GAME_VIEW,
  viewProject: GAME_VIEW,
  viewProjectStats: GAME_VIEW,
  viewProjectSummary: GAME_VIEW,
  viewProjectUserSummary: ['moderator', 'coach', 'backoffice'],
  setProjectArtifact: GAME_PLAY,

  viewUser: GAME_VIEW,
  viewUserStats: ['moderator', 'coach', 'backoffice'],
  viewUserSummary: ['moderator', 'coach', 'backoffice'],
  listUsers: ['moderator', 'coach', 'backoffice'],
  findUsers: GAME_VIEW,

  saveResponse: GAME_PLAY,
  getRetrospectiveSurvey: GAME_PLAY,
  findRetrospectiveSurveys: GAME_PLAY,
  getProjectReviewSurveyStatus: GAME_PLAY,

  runReports: ['moderator', 'sysadmin'],
  monitorJobQueues: ['sysadmin'],
  beIgnoredWhenComputingElo: ['coach'],
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
