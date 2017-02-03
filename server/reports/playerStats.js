/* eslint-disable camelcase */

import {connect} from 'src/db'

import {
  lookupChapterId,
  lookupLatestCycleInChapter,
  writeCSV,
  shortenedPlayerId,
} from './util'
import {
  avgProjHours,
  avgStat,
  avgProjReview,
  playerReviewCount,
  recentCycleIds,
  recentProjectIds,
  recentProjStats,
  projReviewCounts,
} from './playerStatHelpers'

const HEADERS = [
  'cycle_no',
  'player_id',
  'experiencePoints',
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
  'challenge',
]

const DEFAULT_CHAPTER = 'Oakland'

const r = connect()

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res, {headers: HEADERS}))
}

async function runReport(args) {
  const {chapterName} = args

  const chapterId = await lookupChapterId(chapterName || DEFAULT_CHAPTER)
  const cycleNumber = await lookupLatestCycleInChapter(chapterId)

  return await statReport({chapterId, cycleNumber})
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
    .merge(avgStat('challenge'))
    .merge(avgStat('health_culture'))
    .merge(avgStat('health_team_play'))
    .merge(avgStat('health_technical'))
    .merge(avgStat('est_accuracy'))
    .merge(avgStat('est_bias'))
    .merge(playerReviewCount(reviewCount))
    .merge(avgProjReview('avg_proj_comp'))
    .merge(avgProjReview('avg_proj_qual'))
    .map(player => {
      return {
        cycle_no: cycleNumber,
        player_id: shortenedPlayerId(player('id')),
        experiencePoints: player('stats')('experiencePoints'),
        health_culture: player('health_culture'),
        health_team_play: player('health_team_play'),
        health_technical: player('health_technical'),
        est_bias: player('est_bias'),
        est_accuracy: player('est_accuracy'),
        avg_proj_hours: player('avg_proj_hours'),
        avg_proj_comp: player('avg_proj_comp'),
        avg_proj_qual: player('avg_proj_qual'),
        no_proj_rvws: player('no_proj_rvws'),
        elo: player('stats')('elo')('rating'),
        challenge: player('challenge'),
      }
    })
}
