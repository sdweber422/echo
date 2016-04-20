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
    return {id: user.id, chapter: chapterMap[user.inviteCode]}
  })

  return factory.buildMany('player', overwriteObjs, overwriteObjs.length)
}

async function generate() {
  try {
    require('dotenv').load()

    if (!process.env.IDM_RETHINKDB_URL) {
      throw new Error('IDM_RETHINKDB_URL must be set in environment')
    }

    const idmDB = createPool(process.env.IDM_RETHINKDB_URL)
    const gameDB = r

    // we need to base our players and chapters off of the IDM user test data
    const users = await getIDMUsers(idmDB)
    const chapters = await buildChapters(users)
    const players = (await buildPlayers(users, chapters)).map(player => {
      const chapter = player.chapter
      delete player.chapter
      return Object.assign({}, player, {chapterId: chapter.id})
    })

    await gameDB.table('chapters').insert(chapters).run()
    await gameDB.table('players').insert(players).run()

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
