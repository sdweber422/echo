import {connect} from 'src/db'
import {lookupChapterId, lookupCycleId, writeCSV, getPlayerInfoByIds, parseCycleReportArgs} from './util'

const r = connect()

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res))
}

async function runReport(args) {
  const {cycleNumber, chapterName} = parseCycleReportArgs(args)

  const chapterId = await lookupChapterId(chapterName)
  const cycleId = await lookupCycleId(chapterId, cycleNumber)
  const surveyIds = r.table('projects')
    .filter({chapterId})
    .concatMap(row => row('cycleHistory'))
		.filter(row => row('cycleId').eq(cycleId))
    .concatMap(row => [row('retrospectiveSurveyId'), row('projectReviewSurveyId')])
    .distinct()

  const playerIds = await r.table('players').filter({chapterId})('id')
  const playerInfo = await getPlayerInfoByIds(playerIds)

  const query = r.expr(playerInfo).do(playerInfoExpr => {
    const getInfo = id => playerInfoExpr(id).default({name: '?', email: '?', handle: '?'})
    return r.table('responses')
      .filter(response => surveyIds.contains(response('surveyId')))
      .merge(response => ({
        cycleNumber,
        subject: r.table('projects').get(response('subjectId'))('name')
            .default(getInfo(response('subjectId'))('name')),
        question: r.table('questions').get(response('questionId'))('body'),
      }))
      .merge(response => getInfo(response('respondentId')).do(info => ({
        respondentName: info('name'),
        respondentEmail: info('email'),
        respondentHandle: info('handle'),
      })))
  }).pluck(
    'questionId', 'question',
    'subjectId', 'subject', 'value',
    'surveyId',
    'cycleNumber',
    'respondentId', 'respondentName', 'respondentEmail', 'respondentHandle')

  return await query
}
