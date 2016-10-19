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
    .merge(recentProjs(latestProjIds))
    .map(function(player) {
      return {
        'cycle_no': cycleNumber,
        'player_id': player('id'),
        'xp': player('stats')('xp'),
        'avg_proj_hours': player('avg_proj_hours'),
        'elo': player('stats')('elo')('rating'),
      }
    })
}

function avgProjHours(player) {
  return {
    'avg_proj_hours': player('stats')('projects').values()('hours').avg()
  }
}

function recentProjs(latestProjIds) {
  return player => {
    const projs = player('stats')('projects')
                    .coerceTo('array')
                    .map(p => r.expr({projId: p(0)}).merge(p(1)) )
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
