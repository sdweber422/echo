import Promise from 'bluebird'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {CLOSED} from 'src/common/models/project'
import {surveyCompletedBy, surveyLockedFor} from 'src/common/models/survey'
import findActivePlayersInChapter from 'src/server/actions/findActivePlayersInChapter'
import findActiveProjectsForChapter from 'src/server/actions/findActiveProjectsForChapter'
import findProjectEvaluations from 'src/server/actions/findProjectEvaluations'
import getUser from 'src/server/actions/getUser'
import findUsers from 'src/server/actions/findUsers'
import findUserProjectEvaluations from 'src/server/actions/findUserProjectEvaluations'
import handleSubmitSurvey from 'src/server/actions/handleSubmitSurvey'
import handleSubmitSurveyResponses from 'src/server/actions/handleSubmitSurveyResponses'
import getNextCycleIfExists from 'src/server/actions/getNextCycleIfExists'
import getPrevCycleIfExists from 'src/server/actions/getPrevCycleIfExists'
import {
  Chapter, Cycle, Project, Survey, Response, Stat, Question, Phase,
  findProjectsForUser,
  getLatestCycleForChapter,
  findProjects,
} from 'src/server/services/dataService'
import {LGBadRequestError, LGNotAuthorizedError} from 'src/server/util/error'
import {mapById, userCan} from 'src/common/util'

const {
  PROJECT_COMPLETENESS,
  PROJECT_HOURS,
} = STAT_DESCRIPTORS

export function resolveChapter(parent) {
  return parent.chapter || _safeResolveAsync(
    Chapter.get(parent.chapterId || null)
  )
}

export function resolvePhase(parent) {
  return parent.phase || _safeResolveAsync(
    Phase.get(parent.phaseId || null)
  )
}

export function resolveChapterLatestCycle(chapter) {
  return chapter.latestCycle || _safeResolveAsync(
    getLatestCycleForChapter(chapter.id, {default: null})
  )
}

export function resolveChapterActiveProjectCount(chapter) {
  return isNaN(chapter.activeProjectCount) ?
    _safeResolveAsync(
      findActiveProjectsForChapter(chapter.id, {count: true})
    ) : chapter.activeProjectCount
}

export async function resolveChapterActivePlayerCount(chapter) {
  return isNaN(chapter.activePlayerCount) ?
    (await _safeResolveAsync(
      findActivePlayersInChapter(chapter.id)
    ) || []).length : chapter.activePlayerCount
}

export function resolveCycle(parent) {
  return parent.cycle || _safeResolveAsync(
    Cycle.get(parent.cycleId || '')
  )
}

export async function resolveFindProjects(args, currentUser) {
  const {
    identifiers,
    page: {
      direction = null,
      cycleId = null,
    } = {}
  } = args

  if (identifiers) {
    return findProjects(identifiers)
  }

  const currentCycle = cycleId ?
    await Cycle.get(cycleId) :
    await getUser(currentUser.id).then(_ => getLatestCycleForChapter(_.chapterId))

  const cycle = (
    direction === 'next' ? await getNextCycleIfExists(currentCycle) :
    direction === 'prev' ? await getPrevCycleIfExists(currentCycle) :
    currentCycle
  )

  return cycle ?
    Project.filter({cycleId: cycle.id}) :
    []
}

export function resolveProject(parent) {
  return parent.project || _safeResolveAsync(
    Project.get(parent.projectId || '')
  )
}

export function resolveProjectGoal(project) {
  if (!project.goal) {
    return null
  }
  return project.goal
}

export function resolveProjectPlayers(project) {
  if (project.players) {
    return project.players
  }
  return findUsers(project.playerIds)
}

export async function resolveProjectCoach(project) {
  if (project.coach) {
    return project.coach
  }
  if (project.coachId) {
    return getUser(project.coachId)
  }
}

export async function resolveProjectCoachCompletenessScore(project) {
  if (project.coachCompletenessScore) {
    return project.coachCompletenessScore
  }
  if (!project.coachId || !project.projectReviewSurveyId) {
    return null
  }

  const stat = await Stat.filter({descriptor: PROJECT_COMPLETENESS}).nth(0)
  const question = await Question.filter({statId: stat.id, active: true}).nth(0)

  const responses = await Response.filter({
    subjectId: project.id,
    respondentId: project.coachId,
    surveyId: project.projectReviewSurveyId,
    questionId: question.id,
  })
  if (responses.length !== 1) {
    return null
  }
  return responses[0].value
}

export function resolveProjectStats(project) {
  if (project.state !== CLOSED) {
    return {}
  }
  if (project.stats && PROJECT_COMPLETENESS in project.stats) {
    return project.stats
  }
  const projectStats = project.stats || {}
  return {
    [PROJECT_COMPLETENESS]: projectStats[PROJECT_COMPLETENESS] || null,
    [PROJECT_HOURS]: projectStats[PROJECT_HOURS] || null,
  }
}

export async function resolveProjectEvaluations(projectSummary, args, {rootValue: {currentUser}}) {
  const {project} = projectSummary
  if (!project) {
    throw new Error('Invalid project for user summaries')
  }

  if (projectSummary.projectEvaluations) {
    return projectSummary.projectEvaluations
  }

  return _mapUsers(
    await findProjectEvaluations(project),
    'submittedById',
    'submittedBy'
  ).filter(({submittedById}) => (
    project.state === CLOSED ||
    submittedById === currentUser.id ||
    userCan(currentUser, 'viewProjectEvaluation')
  ))
}

export async function resolveProjectUserSummaries(projectSummary, args, {rootValue: {currentUser}}) {
  const {project} = projectSummary
  if (!project) {
    throw new Error('Invalid project for user summaries')
  }

  if (projectSummary.projectUserSummaries) {
    return projectSummary.projectUserSummaries
  }

  const projectUsers = await findUsers(project.playerIds)

  const projectUserMap = mapById(projectUsers)

  return Promise.map(projectUsers, async user => {
    const canViewSummary = user.id === currentUser.id || userCan(currentUser, 'viewProjectUserSummary')
    const summary = canViewSummary ? await getUserProjectSummary(user, project, projectUserMap, currentUser) : {}
    return {user, ...summary}
  })
}

export async function resolveUser(source, {identifier}, {rootValue: {currentUser}}) {
  if (!userCan(currentUser, 'viewUser')) {
    throw new LGNotAuthorizedError()
  }
  const user = await getUser(identifier)
  if (!user) {
    throw new LGBadRequestError(`User not found for identifier ${identifier}`)
  }
  return user
}

export async function resolveUserProjectSummaries(userSummary, args, {rootValue: {currentUser}}) {
  const {user} = userSummary
  if (!user) {
    throw new Error('Invalid user for project summaries')
  }
  if (userSummary.userProjectSummaries) {
    return userSummary.userProjectSummaries
  }

  const projects = await findProjectsForUser(user.id)
  const projectUserIds = projects.reduce((result, project) => {
    if (project.playerIds && project.playerIds.length > 0) {
      result.push(...project.playerIds)
    }
    return result
  }, [])

  const projectUserMap = mapById(await findUsers(projectUserIds))

  const sortedProjects = projects.sort((a, b) => a.createdAt - b.createdAt).reverse()
  return Promise.map(sortedProjects, async project => {
    const summary = await getUserProjectSummary(user, project, projectUserMap, currentUser)
    return {project, ...summary}
  })
}

async function getUserProjectSummary(user, project, projectUserMap, currentUser) {
  if (user.id !== currentUser.id && !userCan(currentUser, 'viewUserStats')) {
    return null
  }
  const userProjectEvaluations = await findUserProjectEvaluations(user, project)
  userProjectEvaluations.forEach(evaluation => {
    evaluation.submittedBy = projectUserMap.get(evaluation.submittedById)
  })

  let userRetrospectiveComplete
  let userRetrospectiveUnlocked

  if (project.retrospectiveSurveyId) {
    const survey = await Survey.get(project.retrospectiveSurveyId)
    userRetrospectiveComplete = surveyCompletedBy(survey, user.id)
    userRetrospectiveUnlocked = !surveyLockedFor(survey, user.id)
  }

  return {
    userProjectEvaluations,
    userRetrospectiveComplete,
    userRetrospectiveUnlocked,
  }
}

export async function resolveSubmitSurvey(source, {surveyId}, {rootValue: {currentUser}}) {
  await handleSubmitSurvey(surveyId, currentUser.id)
  return {success: true}
}

export async function resolveSaveRetrospectiveSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  _assertUserAuthorized(currentUser, 'saveResponse')
  await _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses)
  return handleSubmitSurveyResponses(responses)
}

function _assertUserAuthorized(user, action) {
  if (!user || !userCan(user, action)) {
    throw new LGNotAuthorizedError()
  }
}

function _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses) {
  responses.forEach(response => {
    if (currentUser.id !== response.respondentId) {
      throw new LGBadRequestError('You cannot submit responses for other players.')
    }
  })
}

async function _mapUsers(collection, userIdKey = 'userId', userKey = 'user') {
  if (!Array.isArray(collection) || collection.length === 0) {
    return []
  }

  const userIds = collection.map(item => item[userIdKey])
  const usersById = mapById(await findUsers(userIds))
  collection.forEach(item => {
    item[userKey] = usersById.get(item[userIdKey])
  })

  return collection
}

async function _safeResolveAsync(query) {
  try {
    return await query
  } catch (err) {
    console.error(err)
    return null
  }
}
