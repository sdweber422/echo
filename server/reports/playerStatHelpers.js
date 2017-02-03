/* eslint-disable camelcase */
import {connect} from 'src/db'

const QUESTIONS = {
  completeness: '65cad3c5-e9e9-4284-999b-3a72c481c55e',
  quality: '2c335ce5-ed0b-4068-92c8-56666fb7fdad',
}

// map stat names to their properties in the db
const STAT_MAPPING = {
  health_culture: 'cc',
  health_team_play: 'teamPlay',
  health_technical: 'th',
  est_bias: 'bias',
  est_accuracy: 'accuracy',
  avg_proj_comp: 'completeness',
  avg_proj_qual: 'quality',
  challenge: 'challenge',
}

const RECENT_CYCLE_RANGE = 6

const r = connect()

export const avgStat = statName => {
  const dbProp = STAT_MAPPING[statName]

  return player => {
    const obj = {}
    obj[statName] = player('recentProjs')
      .filter(p => p.hasFields(dbProp))
      .avg(dbProp)
      .default(0)
    return obj
  }
}

export const avgProjReview = reviewType => {
  const dbProp = STAT_MAPPING[reviewType]

  return player => {
    const obj = {}
    obj[reviewType] = playerProjReviews(player, dbProp).avg().default(0)
    return obj
  }
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
          .between(
            [QUESTIONS[reviewType], r.minval, r.minval],
            [QUESTIONS[reviewType], r.maxval, r.maxval],
            {index: 'questionIdAndRespondentIdAndSurveyId'}
          )
          .filter(resp => projIds.contains(resp('subjectId')))
          .group('subjectId')
          .avg('value')
          .ungroup()
          .map(row => ({projId: row('group'), review: row('reduction')}))('review')
}

export function projReviewCounts() {
  return r.table('responses')
          .between(
            [QUESTIONS.completeness, r.minval, r.minval],
            [QUESTIONS.completeness, r.maxval, r.maxval],
            {index: 'questionIdAndRespondentIdAndSurveyId'}
          )
          .group('respondentId')
          .count()
          .ungroup()
          .map(rv => ({id: rv('group'), count: rv('reduction')}))
}

export function recentProjStats(latestProjIds) {
  return player => {
    const projs = player('stats')('projects')
                    .coerceTo('array')
                    .filter(proj => latestProjIds.contains(proj(0)))
                    .map(proj => {
                      const projId = proj(0)
                      const projData = proj(1)
                      const bias = proj(1)('rcSelf').sub(proj(1)('rcOther'))
                      const accuracy = bias.gt(0).branch(r.expr(100).sub(bias), r.expr(100).sub(bias.mul(-1)))

                      return projData.merge({projId, bias, accuracy})
                    })
    return {recentProjs: projs}
  }
}

export function recentCycleIds(chapterId, cycleNumber) {
  const firstCycleNo = Number(cycleNumber) - RECENT_CYCLE_RANGE

  return r.table('cycles')
          .filter({chapterId})
          .filter(c => c('cycleNumber').gt(firstCycleNo).and(c('cycleNumber').le(cycleNumber)))('id')
}

export function recentProjectIds(recentCycleIds) {
  return r.table('projects')
          .filter(p => recentCycleIds.contains(p('cycleId')))('id')
}
