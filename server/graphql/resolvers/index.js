import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {REFLECTION} from 'src/common/models/cycle'
import {getChapterById} from 'src/server/db/chapter'
import {getCycleById} from 'src/server/db/cycle'
import {getProjectById} from 'src/server/db/project'
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'
import {assertPlayersCurrentCycleInState, handleError} from 'src/server/graphql/util'

export async function resolveCycleChapter(cycle) {
  if (cycle.chapter) {
    return cycle.chapter
  }
  if (cycle.chapterId) {
    return await getChapterById(cycle.chapterId)
  }
}

export async function resolveProjectChapter(project) {
  if (project.chapter) {
    return project.chapter
  }
  if (project.chapterId) {
    return await getChapterById(project.chapterId)
  }
}

export async function resolveProjectCycle(project) {
  if (project.cycle) {
    return project.cycle
  }
  if (project.cycleId) {
    return await getCycleById(project.cycleId)
  }
}

export async function resolveSurveyProject(parent) {
  if (parent.project) {
    return parent.project
  }
  if (parent.projectId) {
    return await getProjectById(parent.projectId)
  }
}

export async function resolveInputSurveyResponses(source, {responses}, {rootValue: {currentUser}}) {
  if (!currentUser || !userCan(currentUser, 'saveResponse')) {
    throw new GraphQLError('You are not authorized to do that.')
  }

  await assertPlayersCurrentCycleInState(currentUser, REFLECTION)

  const createdIdsLists = await Promise.all(responses.map(response => {
    if (response.respondentId && currentUser.id !== response.respondentId) {
      throw new GraphQLError('You cannot submit responses for other players.')
    }

    return saveSurveyResponse({
      respondentId: currentUser.id,
      surveyId: response.surveyId,
      questionId: response.questionId,
      values: response.values,
    })
  })).catch(err => handleError(err, 'Failed to save responses'))

  const flattenedCreatedIds = createdIdsLists.reduce((list, next) => list.concat(next), [])

  return {createdIds: flattenedCreatedIds}
}
