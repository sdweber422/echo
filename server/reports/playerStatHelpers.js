/* eslint-disable camelcase */
import r from 'src/db/connect'

const QUESTIONS = {
  completeness: '65cad3c5-e9e9-4284-999b-3a72c481c55e',
  quality: '2c335ce5-ed0b-4068-92c8-56666fb7fdad',
}

const RECENT_CYCLE_RANGE = 6

export const avgHealthCulture = player => {
  return {health_culture: player('recentProjs').avg('cc').default(0)}
}

export const avgHealthTeamPlay = player => {
  return {health_team_play: player('recentProjs').avg('tp').default(0)}
}

export const estimationBias = player => {
  return {est_bias: player('recentProjs').avg('bias').default(0)}
}

export const estimationAccuracy = player => {
  return {est_accuracy: player('recentProjs').avg('accuracy').default(0)}
}

export const avgProjCompleteness = player => {
  return {avg_proj_comp: playerProjReviews(player, 'completeness').avg().default(0)}
}

export const avgProjQuality = player => {
  return {avg_proj_qual: playerProjReviews(player, 'quality').avg().default(0)}
}

export const avgProjHours = player => {
  return {avg_proj_hours: player('stats')('projects').values()('hours').avg()}
}

export const playerReviewCount = reviewCount => {
  return player => {
    return {no_proj_rvws: reviewCount.filter({id: player('id')})('count').default(0)}
  }
}

export function playerProjReviews(player, reviewType) {
  const projIds = player('recentProjs')('projId')

  return r.table('responses')
          .filter(resp => {
            return resp('questionId').eq(QUESTIONS[reviewType])
                    .and(projIds.contains(resp('subjectId')))
          })
          .group('subjectId')
          .avg('value')
          .ungroup()
          .map(row => ({projId: row('group'), review: row('reduction')}))('review')
}

export function projReviewCounts() {
  return r.table('responses')
          .filter({questionId: QUESTIONS.completeness})
          .group('respondentId').count()
          .ungroup()
          .map(rv => ({id: rv('group'), count: rv('reduction')}))
}

export function recentProjStats(latestProjIds) {
  return player => {
    const projs = player('stats')('projects')
                    .coerceTo('array')
                    .map(proj => {
                      const bias = proj(1)('rcSelf').sub(proj(1)('rcOther'))
                      const accuracy = bias.gt(0).branch(r.expr(100).sub(bias), r.expr(100).sub(bias.mul(-1)))

                      return proj(1).merge({projId: proj(0), bias, accuracy})
                    })
                    .filter(p => latestProjIds.contains(p('projId')))
    return {recentProjs: projs}
  }
}

export function recentCycleIds(chapterId, cycleNumber) {
  const firstCycleNo = Number(cycleNumber) - RECENT_CYCLE_RANGE

  return r.table('cycles')
          .filter({chapterId})
          .filter(c => c('cycleNumber').gt(firstCycleNo).and(c('cycleNumber').le(cycleNumber)))
          ('id')
}

export function recentProjectIds(recentCycleIds) {
  return r.table('projects')
          .filter(p => recentCycleIds.contains(p('cycleHistory')(0)('cycleId')))
          ('id')
}
