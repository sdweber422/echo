// To run this script invoke like this:
//
// RETHINKDB_URL=rethinkdb://localhost:28015/game_<YOUR ENV> npm run dev:playtestchapter
//
// you can pass a playerId as well if you want to have that user moved to the new chapter

import r from '../db/connect'
import factory from './factories'
import randomMemorableName from '../common/util/randomMemorableName'
import {GOAL_SELECTION} from '../common/models/cycle'
import {reassignPlayersToChapter} from '../server/db/player'

if (!module.parent) {
  const command = process.argv[2]
  if (command === 'create') {
    create(process.argv[3])
  }
  else if (command === 'destroy') {
    destroy(process.argv[3], process.argv[4])
  }
  else {
    console.log(
`USAGE:
  ${process.argv[1]} create [playerId]
  ${process.argv[1]} destroy chapterId [playerId]
`
  )
  }
  r.getPoolMaster().drain()
}

async function create(playerId) {
  try {
    require('dotenv').load()

    const chapter = await factory.create('chapter', {name: `Playtest ${randomMemorableName()}`})
    console.log(`Created chapter "${chapter.name}" [${chapter.id}]`)
    const cycle = await factory.create('cycle', {chapterId: chapter.id, state: GOAL_SELECTION})
    console.log(`Created cycle [${cycle.cycleNumber}]`)
    const players = await factory.createMany('player', {chapterId: chapter.id}, 15)
    console.log(`${players.length} Players Created`)
    const votes = await factory.createMany('vote',
      players.map((player, i) => ({
        cycleId: cycle.id,
        playerId: player.id,
        pendingValidation: true,
        notYetValidatedGoalDescriptors: [`${i % 5}`, `${(i % 5) + 1}`],
      })),
      players.length,
    )
    console.log(`${votes.length} Votes Cast`)

    if (playerId) {
      console.log(`Moving player [${playerId}] to chapter [${chapter.name}]`)
      await reassignPlayersToChapter([playerId], chapter.id)
    }

    console.log(`To remove this data run this command:\n\t RETHINKDB_URL=${process.env.RETHINKDB_URL} npm run dev:playtestchapter destroy ${chapter.id} ${playerId || ''}`)
  } catch (error) {
    console.error(error.stack)
  }
}

async function destroy(chapterId, playerId) {
  try {
    require('dotenv').load()

    const deletedChapter = await r.table('chapters').get(chapterId).delete({returnChanges: true}).run()
    if (deletedChapter.changes) {
      console.log('deleted chapter', deletedChapter.changes.map(c => c.old_val))
    }

    const deletedCycles = await r.table('cycles').filter({chapterId}).delete({returnChanges: true}).run()
    if (deletedCycles.changes) {
      console.log('deleted cycles', deletedCycles.changes.map(c => c.old_val.id))
    }

    let deletePlayersQuery = r.table('players').filter({chapterId})
    if (playerId) {
      deletePlayersQuery = deletePlayersQuery.filter(r.row('id').ne(playerId))
    }
    const deletedPlayers = await deletePlayersQuery.delete({returnChanges: true}).run()
    if (deletedPlayers.changes) {
      console.log('deleted players', deletedPlayers.changes.map(c => c.old_val.id))
    }

    if (playerId) {
      const player = await r.table('players').get(playerId).run()
      const oldChapter = await r.table('chapters').get(player.chapterHistory[0].chapterId).run()
      if (oldChapter) {
        console.log(`Moving player [${playerId}] back to chapter [${oldChapter.name}]`)
        await reassignPlayersToChapter([playerId], oldChapter.id)
      }
      else {
        console.log('ERROR: Cannot find previous chapter to move player into!')
      }
    }

    r.getPoolMaster().drain()
  } catch (error) {
    console.error(error.stack)
  }
}
