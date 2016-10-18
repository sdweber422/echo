import csvWriter from 'csv-write-stream'

import config from 'src/config'
import r from 'src/db/connect'
import {graphQLFetcher} from 'src/server/util'
import {getCyclesForChapter} from 'src/server/db/cycle'

export async function lookupCycleId(chapterId, cycleNumber) {
  return await getCyclesForChapter(chapterId).filter({cycleNumber}).nth(0)('id')
    .catch(err => {
      console.error(`Unable to find a cycle with cycleNumber ${cycleNumber}`, err)
      throw new Error(`Unable to find a cycle with cycleNumber ${cycleNumber}`)
    })
}

export async function lookupChapterId(chapterName) {
  return await r.table('chapters').filter({name: chapterName}).nth(0)('id')
    .catch(err => {
      console.error(`Unable to find a chapter named ${chapterName}`, err)
      throw new Error(`Unable to find a chapter named ${chapterName}`)
    })
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

export function parseArgs(args) {
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
