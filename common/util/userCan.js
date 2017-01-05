const ADMIN = [
  'backoffice',
  'moderator',
]

const ALL = [
  'backoffice',
  'moderator',
  'player',
  'proplayer',
]

const CAPABILITY_ROLES = {
  listChapters: ADMIN,
  findChapters: ALL,
  createChapter: [
    'backoffice',
  ],
  updateChapter: [
    'backoffice',
  ],
  createInviteCode: [
    'backoffice',
  ],

  createCycle: ADMIN,
  launchCycle: ADMIN,
  updateCycle: ADMIN,
  editCycleDuration: ADMIN,
  viewCycleVotingResults: ALL,

  importProject: ADMIN,
  updateProject: ADMIN,
  listProjects: ADMIN,
  findProjects: ALL,
  viewProject: ALL,
  viewProjectStats: ALL,
  viewProjectSummary: ALL,
  viewProjectUserSummary: ADMIN,
  setProjectArtifact: ALL,

  reassignPlayersToChapter: ADMIN,

  viewUser: ALL,
  viewUserStats: ADMIN,
  viewUserSummary: ADMIN,
  viewUserProjectSummary: ADMIN,
  listUsers: ADMIN,
  findUsers: ALL,

  saveResponse: ALL,

  getRetrospectiveSurvey: ALL,
  findRetrospectiveSurveys: ALL,

  getProjectReviewSurveyStatus: [
    'player',
    'backoffice',
  ],

  runReports: [
    'backoffice'
  ],

  monitorJobQueues: [
    'backoffice',
  ],

  beIgnoredWhenComputingElo: [
    'proplayer',
  ]
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
