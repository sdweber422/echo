/* eslint-disable camelcase */

import r from 'src/db/connect'

import {lookupChapterId, lookupCycleId, writeCSV, parseArgs} from './util'
import {
  avgProjHours,
  avgHealthCulture,
  avgHealthTeamPlay,
  estimationBias,
  estimationAccuracy,
  avgProjCompleteness,
  avgProjQuality,
  playerReviewCount,
  recentCycleIds,
  recentProjectIds,
  recentProjStats,
  projReviewCounts,
} from './playerStatHelpers'

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

  return await statReport({chapterId, cycleId, cycleNumber})
}

async function statReport(params) {
  const {chapterId, cycleNumber} = params
  const latestProjIds = recentProjectIds(recentCycleIds(chapterId, cycleNumber))
  const reviewCount = projReviewCounts()

  return await r.table('players')
    .filter(r.row('chapterId').eq(chapterId)
             .and(r.row('active').eq(true)
             .and(r.row('stats').hasFields('projects'))))
    .merge(avgProjHours)
    .merge(recentProjStats(latestProjIds))
    .merge(avgHealthCulture)
    .merge(avgHealthTeamPlay)
    .merge(estimationBias)
    .merge(estimationAccuracy)
    .merge(playerReviewCount(reviewCount))
    .merge(avgProjCompleteness)
    .merge(avgProjQuality)
    .map(player => {
      return {
        cycle_no: cycleNumber,
        player_id: player('id').split('-')(0),
        xp: player('stats')('xp'),
        health_culture: player('health_culture'),
        health_team_play: player('health_team_play'),
        est_bias: player('est_bias'),
        est_accuracy: player('est_accuracy'),
        avg_proj_hours: player('avg_proj_hours'),
        avg_proj_comp: player('avg_proj_comp'),
        avg_proj_qual: player('avg_proj_qual'),
        no_proj_rvws: player('no_proj_rvws'),
        elo: player('stats')('elo')('rating'),
      }
    })
}
