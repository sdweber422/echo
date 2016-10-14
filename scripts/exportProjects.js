/* eslint-disable import/imports-first */
import parseArgs from 'minimist'

// FIXME: replace globals with central (non-global) config
global.__SERVER__ = true

const fs = require('fs')
const path = require('path')
const r = require('src/db/connect')
const getPlayerInfo = require('src/server/actions/getPlayerInfo')
const {getProjectsForChapterInCycle} = require('src/server/db/project')
const {finish} = require('./util')

const OUTFILE = path.resolve(process.cwd(), 'tmp/projects.json')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {CHAPTER_NAME, CYCLE_NUMBER} = _parseCLIArgs(process.argv.slice(2))

  // console.log(LOG_PREFIX, `Retrieving chapter ${CHAPTER_NAME} cyle ${CYCLE_NUMBER} project teams`)

  const chapters = await r.table('chapters').filter({name: CHAPTER_NAME})
  const chapter = chapters[0]
  if (!chapter) {
    throw new Error(`Invalid chapter name: ${CHAPTER_NAME}`)
  }

  const cycles = await r.table('cycles').filter({chapterId: chapter.id, cycleNumber: CYCLE_NUMBER})
  const cycle = cycles[0]
  if (!cycle) {
    throw new Error(`Invalid cycle number ${CYCLE_NUMBER} for chapter ${CHAPTER_NAME}`)
  }

  const projects = await getProjectsForChapterInCycle(chapter.id, cycle.id)
  const projectsWithPlayers = await Promise.all(projects.map(async (p, index) => {
    return {
      ...projects[index],
      players: await getPlayerInfo(((p.cycleHistory || [])[0] || []).playerIds)
    }
  }))

  const output = projectsWithPlayers.map(project => {
    return {
      chapterId: project.chapterId,
      chapterName: CHAPTER_NAME,
      cycleNumber: CYCLE_NUMBER,
      projectName: project.name,
      playerHandles: project.players.map(player => player.handle)
    }
  })

  fs.writeFileSync(OUTFILE, JSON.stringify(output, null, 4))
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  if (args._.length !== 2) {
    throw new Error('Usage: npm run print:projects CHAPTER_NAME CYCLE_NUMBER')
  }
  const [CHAPTER_NAME, CYCLE_NUMBER] = args._
  return {CHAPTER_NAME, CYCLE_NUMBER}
}
