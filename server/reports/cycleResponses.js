import stream from 'stream'
import csvWriter from 'csv-write-stream'
import {graphQLFetcher} from '../../server/util'
import r from '../../db/connect'

export default function requestHandler(req, res) {
  return runReport(req.query)
    .then(result => res.send(result))
}

async function runReport(args) {
  const {cycleNumber, chapterName} = parseArgs(args)

  const chapterId = await lookupChapterId(chapterName)
  const playerIds = await r.table('players').filter({chapterId})('id')
  const playerInfo = await getPlayerInfoByIds(playerIds)

  const query = r.expr(playerInfo).do(playerInfoExpr => {
    const getHandle = id => playerInfoExpr(id).default({handle: '?'})('handle')
    return r.table('responses')
      .merge(response => ({
        subject: r.table('projects').get(response('subjectId'))('name')
            .default(getHandle(response('subjectId'))),
        question: r.table('questions').get(response('questionId'))('body'),
      }))
      .merge(response => playerInfoExpr(response('respondentId')).default({}).do(info => ({
        respondentName: info('name'),
        respondentEmail: info('email'),
        respondentHandle: info('handle'),
      })))
      .merge(response =>
        r.table('projects').coerceTo('array').filter(p =>
          p('cycleHistory').nth(0).do(hist =>
            hist('projectReviewSurveyId').default(null).eq(response('surveyId'))
            .or(hist('retrospectiveSurveyId').default(null).eq(response('surveyId')))
          )
        ).eqJoin(p => p('cycleHistory').nth(0)('cycleId'), r.table('cycles'))
         .zip().pluck('cycleNumber', 'chapterId').nth(0).default({})
      )
  }).pluck(
    'questionId', 'question',
    'subjectId', 'subject', 'value',
    'surveyId',
    'cycleNumber', 'chapterId',
    'respondentId', 'respondentName', 'respondentEmail', 'respondentHandle')
   .filter({chapterId, cycleNumber})
   .without('chapterId')

  const results = await query

  return toCSV(results)
}

async function lookupChapterId(chapterName) {
  return await r.table('chapters').filter({name: chapterName}).nth(0)('id')
    .catch(err => {
      console.error(`Unable to find a chaopter named ${chapterName}`, err)
      throw new Error(`Unable to find a chaopter named ${chapterName}`)
    })
}

function toCSV(rows) {
  let data = ''

  const writeStream = new stream.Writable({
    write(chunk, encoding, cb) {
      data += chunk
      cb()
    }
  })

  const writer = csvWriter()
  writer.pipe(writeStream)
  rows.forEach(row => writer.write(row))
  writer.end()

  return data
}

function parseArgs(args) {
  const requiredArgs = ['cycleNumber', 'chapterName']

  requiredArgs.forEach(arg => {
    if (!args[arg]) {
      throw new Error(`${arg} is a required parameter`)
    }
  })

  return {
    ...args,
    cycleNumber: parseInt(args.cycleNumber, 10),
  }
}

function getPlayerInfoByIds(playerIds) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: `
query ($playerIds: [ID]!) {
  getUsersByIds(ids: $playerIds) {
    id
    email
    name
    handle
  }
}`,
    variables: {playerIds},
  })
  .then(result => result.data.getUsersByIds.reduce(
    (prev, player) => ({...prev, [player.id]: player}),
    {}
  ))
}
