import r from 'src/db/connect'

import {lookupChapterId, lookupCycleId, writeCSV, getPlayerInfoByIds, parseArgs} from './util'
import {experiencePoints} from 'src/server/util/stats'

const HEADERS = [
  'id',
  'xp',
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
    .filter({chapterId: chapterId, active: true})
    .map(function(p) {
      return { 'id': p('id'), 'xp': p('stats')('xp'), 'elo': p('stats')('elo')('rating') }
    })

  return await stats
}
