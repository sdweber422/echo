import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('project', r.table('projects'), {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    cycleTeams(cb) {
      const createCycles = factory.assocMany('cycle', 'id', 2, {chapterId: this.chapterId})
      const createPlayers = factory.assocMany('player', 'id', 8, {chapterId: this.chapterId})

      createCycles((err, cycles) => {
        if (err) {
          return cb(err)
        }
        createPlayers((err, players) => {
          if (err) {
            return cb(err)
          }
          cb(null, {
            [cycles[0]]: {
              playerIds: players.slice(0, 4)
            },
            [cycles[1]]: {
              playerIds: players.slice(4, 8)
            }
          })
        })
      })
    },
    goal: factory.sequence(n => {
      return {
        url: `http://example.com/repo/issue/${n}`,
        title: faker.lorem.words(4),
      }
    }),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
