import csvWriter from 'csv-write-stream'

import config from 'src/config'
import {connect} from 'src/db'
import {findCyclesForChapter} from 'src/server/services/dataService'
import graphQLFetcher from 'src/server/util/graphql'

const r = connect()

export function lookupCycleId(chapterId, cycleNumber) {
  return findCyclesForChapter(chapterId)
    .filter({cycleNumber})
    .nth(0)('id')
    .catch(err => {
      console.error(`Unable to find a cycle with cycleNumber ${cycleNumber}`, err)
      throw new Error(`Unable to find a cycle with cycleNumber ${cycleNumber}`)
    })
}

export function lookupChapterId(chapterName) {
  return r.table('chapters')
    .filter({name: chapterName})
    .nth(0)('id')
    .catch(err => {
      console.error(`Unable to find a chapter named ${chapterName}`, err)
      throw new Error(`Unable to find a chapter named ${chapterName}`)
    })
}

export function lookupLatestCycleInChapter(chapterId) {
  return r.table('cycles')
    .filter({chapterId})
    .max('cycleNumber')('cycleNumber')
}

export function writeCSV(rows, outStream, opts) {
  const writer = csvWriter(opts || {})
  writer.pipe(outStream)
  rows.forEach(row => writer.write(row))
  writer.end()
}

export function getPlayerInfoByIds(playerIds) {
  return graphQLFetcher(config.server.idm.baseURL)({
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

export function shortenedPlayerId(rethinkDBid) {
  return rethinkDBid.split('-')(0)
}

export function parseCycleReportArgs(args) {
  const requiredArgs = ['cycleNumber']

  requiredArgs.forEach(arg => {
    if (!args[arg]) {
      throw new Error(`${arg} is a required parameter`)
    }
  })

  if (!args.chapterName && !args.chapterId) {
    throw new Error('Must provide chapterName or chapterId')
  }

  return {
    ...args,
    cycleNumber: parseInt(args.cycleNumber, 10),
  }
}
