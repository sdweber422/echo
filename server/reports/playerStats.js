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

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res, {headers: HEADERS}))
}

async function runReport(args) {
  const {cycleNumber, chapterName} = parseArgs(args)

  const chapterId = await lookupChapterId(chapterName)
  const cycleId = await lookupCycleId(chapterId, cycleNumber)

  const stats = r.table('players')
    .filter( r.row('chapterId').eq(chapterId)
              .and(r.row('active').eq(true)
              .and(r.row('stats').hasFields('projects'))) )
    .merge(avgProjHours)
    .map(function(player) {
      return {
        'cycle_no': cycleNumber,
        'player_id': player('id'),
        'xp': player('stats')('xp'),
        'avg_proj_hours': player('avg_proj_hours'),
        'elo': player('stats')('elo')('rating'),
      }
    })

  return await stats
}

function avgProjHours(player) {
  return {
    'avg_proj_hours': player('stats')('projects').values()('hours').avg()
  }
}
