import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('project', r.table('projects'), {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    history(cb) {
      const createCycles = factory.assocMany('cycle', 'id', 2, {chapterId: this.chapterId})
      const createPlayers = factory.assocMany('player', 'id', 8, {chapterId: this.chapterId})

      createCycles((err, cycleIds) => {
        if (err) {
          return cb(err)
        }
        createPlayers((err, playerIds) => {
          if (err) {
            return cb(err)
          }
          cb(null, [
            {cycleId: cycleIds[0], playerIds: playerIds.slice(0, 4)},
            {cycleId: cycleIds[1], playerIds: playerIds.slice(4, 8)},
          ])
        })
      })
    },
    goal: factory.sequence(n => {
      return {
        url: `http://example.com/repo/issue/${n}`,
        title: `Goal #${n}`,
      }
    }),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
