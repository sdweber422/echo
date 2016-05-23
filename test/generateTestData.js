import factory from './factories'
import r, {createPool} from '../db/connect'

function getIDMUsers(idmDB) {
  return idmDB.table('users').run()
}

function buildChapters(users) {
  const inviteCodes = [...new Set(users.map(user => user.inviteCode))]
  const inviteCodesObjs = Array.from(inviteCodes.keys())
    .map(i => ({inviteCodes: [inviteCodes[i]]}))

  return factory.buildMany('chapter', inviteCodesObjs, inviteCodesObjs.length)
}

function buildPlayers(users, chapters) {
  const chapterMap = chapters.reduce((curr, chapter) => {
    curr[chapter.inviteCodes[0]] = chapter
    return curr
  }, {})

  const overwriteObjs = users.map(user => {
    return {id: user.id, handle: user.handle, chapter: chapterMap[user.inviteCode]}
  })

  return factory.buildMany('player', overwriteObjs, overwriteObjs.length)
}

function buildCycles(chapters) {
  const overwriteObjs = []
  chapters.forEach(chapter => {
    const chapterOverwriteObjs = Array.from(Array(10).keys()).map(i => {
      const now = new Date()
      now.setDate(now.getDate() + (7 * i))
      return {
        chapter,
        cycleNumber: i + 1,
        startTimestamp: now,
        state: 'GOAL_SELECTION',
      }
    })
    overwriteObjs.push(...chapterOverwriteObjs)
  })
  return factory.buildMany('cycle', overwriteObjs, overwriteObjs.length)
}

function buildVotes(players, cycles) {
  const overwriteObjs = []
  players.forEach(player => {
    cycles.forEach(cycle => {
      if (player.chapter.id === cycle.chapter.id) {
        overwriteObjs.push({player, cycle})
      }
    })
  })
  return factory.buildMany('vote', overwriteObjs, overwriteObjs.length)
}

async function generate() {
  try {
    require('dotenv').load()

    if (!process.env.IDM_RETHINKDB_URL) {
      throw new Error('IDM_RETHINKDB_URL must be set in environment')
    }

    const idmDB = createPool(process.env.IDM_RETHINKDB_URL)
    const gameDB = r

    // we need to base our data off of the IDM user test data
    const users = await getIDMUsers(idmDB)
    const chapters = await buildChapters(users)
    const players = await buildPlayers(users, chapters)
    const cycles = await buildCycles(chapters)
    const votes = await buildVotes(players, cycles)

    // our factories generate nested objects that need to be flattened
    const flattenedPlayers = players.map(player => {
      const chapter = player.chapter
      delete player.chapter
      return Object.assign({}, player, {chapterId: chapter.id})
    })
    const flattenedCycles = cycles.map(cycle => {
      const chapter = cycle.chapter
      delete cycle.chapter
      return Object.assign({}, cycle, {chapterId: chapter.id})
    })
    const flattenedVotes = votes.map(vote => {
      const player = vote.player
      const cycle = vote.cycle
      delete vote.player
      delete vote.cycle
      return Object.assign({}, vote, {playerId: player.id, cycleId: cycle.id})
    })

    await gameDB.table('chapters').insert(chapters).run()
    await gameDB.table('players').insert(flattenedPlayers).run()
    await gameDB.table('cycles').insert(flattenedCycles).run()
    await gameDB.table('votes').insert(flattenedVotes).run()

    idmDB.getPoolMaster().drain()
    gameDB.getPoolMaster().drain()
  } catch (error) {
    console.error(error.stack)
  }
}

export default generate

if (!module.parent) {
  generate()
}
