import r from '../../db/connect'

import {RETROSPECTIVE} from '../../common/models/cycle'

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey.id, survey)
  }
  return insert(survey)
}

export async function getCurrentRetrospectiveSurveyForPlayer(playerId) {
  try {
    const {chapterId} = await r.table('players').get(playerId).pluck('chapterId').run()
    const [{id: cycleId}] = await r.table('cycles').filter({
      state: RETROSPECTIVE,
      chapterId,
    }).pluck('id')
      .run()
    const [{id: projectId}] = await r.table('projects').filter(
      r.row('cycleTeams')(cycleId)('playerIds').contains(playerId)
    ).pluck('id')
      .run()
    const [result] = await getProjectRetroSurvey(projectId, cycleId)
    return result
  } catch (e) {
    throw (e)
  }
}

export function getProjectRetroSurvey(projectId, cycleId) {
  return r.table('surveys').getAll([cycleId, projectId], {index: 'cycleIdAndProjectId'}).run()
}

function update(id, survey) {
  const surveyWithTimestamps = Object.assign({}, survey, {
    updatedAt: r.now(),
  })
  return r.table('surveys').get(id).update(surveyWithTimestamps).run()
}

function insert(survey) {
  const surveyWithTimestamps = Object.assign({}, survey, {
    updatedAt: r.now(),
    createdAt: r.now(),
  })
  return r.table('surveys').insert(surveyWithTimestamps).run()
}
