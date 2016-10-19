import r from 'src/db/connect'

import {lookupChapterId, lookupCycleId, writeCSV, parseArgs} from './util'

const HEADERS = [
  'cycle_no',
  'player_id',
  'xp',
  // 'avg_cycle_hours',
  'avg_proj_hours',
  'avg_proj_comp',
  'avg_proj_qual',
  'health_culture',
  'health_team_play',
  'health_technical',
  'est_accuracy',
  'est_bias',
  'no_proj_rvws',
  'elo',
]

const RECENT_CYCLE_RANGE = 6

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res, {headers: HEADERS}))
}

async function runReport(args) {
  const {cycleNumber, chapterName} = parseArgs(args)

  const chapterId = await lookupChapterId(chapterName)
  const cycleId = await lookupCycleId(chapterId, cycleNumber)

  return await statReport({chapterId, cycleId, cycleNumber})
}

async function statReport(params) {
  const {chapterId, cycleNumber} = params
  const latestProjIds = recentProjectIds( recentCycleIds(chapterId, cycleNumber) )

  return await r.table('players')
    .filter( r.row('chapterId').eq(chapterId)
              .and(r.row('active').eq(true)
              .and(r.row('stats').hasFields('projects'))) )
    .merge(avgProjHours)
    .merge(recentProjStats(latestProjIds))
    .merge(avgHealthCulture)
    .merge(avgHealthTeamPlay)
    .merge(estimationBias)
    .merge(estimationAccuracy)
    .map(function(player) {
      return {
        'cycle_no': cycleNumber,
        'player_id': player('id'),
        'xp': player('stats')('xp'),
        'health_culture': player('health_culture'),
        'health_team_play': player('health_team_play'),
        'est_bias': player('est_bias'),
        'est_accuracy': player('est_accuracy'),
        'avg_proj_hours': player('avg_proj_hours'),
        'elo': player('stats')('elo')('rating'),
      }
    })
}

const avgHealthCulture = (player) => {
  return { 'health_culture': player('recentProjs').avg('cc').default(0) }
}

const avgHealthTeamPlay = (player) => {
  return { 'health_team_play': player('recentProjs').avg('tp').default(0) }
}

const estimationBias = (player) => {
  return { 'est_bias': player('recentProjs').avg('bias').default(0) }
}

const estimationAccuracy = (player) => {
  return { 'est_accuracy': player('recentProjs').avg('accuracy').default(0) }
}

function avgProjHours(player) {
  return {
    'avg_proj_hours': player('stats')('projects').values()('hours').avg()
  }
}

function recentProjStats(latestProjIds) {
  return player => {
    const projs = player('stats')('projects')
                    .coerceTo('array')
                    .map(proj => {
                      const bias = proj(1)('rcSelf').sub(proj(1)('rcOther'))
                      const accuracy = bias.gt(r.expr(0)).branch(r.expr(100).sub(bias), r.expr(100).sub(bias.mul(r.expr(-1))))

                      return proj(1).merge({ projId: proj(0), bias: bias, accuracy: accuracy })
                    })
                    .filter(p => latestProjIds.contains(p('projId')) )
    return r.expr({
      recentProjs: projs
    })
  }
}

function recentCycleIds(chapterId, cycleNumber) {
  const firstCycleNo = Number(cycleNumber) - RECENT_CYCLE_RANGE

  return r.table('cycles')
          .filter({chapterId})
          .filter(c => c('cycleNumber').gt(firstCycleNo).and(c('cycleNumber').le(cycleNumber)))
          .concatMap(c => [c('id')])
}

function recentProjectIds(recentCycleIds) {
  return r.table('projects')
          .filter(p => recentCycleIds.contains(p('cycleHistory')(0)('cycleId')) )
          .concatMap(p => [p('id')])
}
