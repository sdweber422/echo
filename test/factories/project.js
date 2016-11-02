import faker from 'faker'

import {connect} from 'src/db'
import {REFLECTION} from 'src/common/models/cycle'

const r = connect()
const now = new Date()

export default function define(factory) {
  factory.define('project', r.table('projects'), {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    cycleId(cb) {
      const {chapterId} = this
      const createCycles = factory.assocMany('cycle', 'id', 1, [{chapterId, state: REFLECTION}])
      createCycles((err, cycleIds) => {
        cb(err, cycleIds[0])
      })
    },
    playerIds(cb) {
      const {chapterId} = this
      const createPlayers = factory.assocMany('player', 'id', 8, {chapterId})
      createPlayers((err, playerIds) => {
        cb(err, playerIds.slice(0, 4))
      })
    },
    goal: factory.sequence(n => {
      return {
        url: `http://example.com/repo/issue/${n}`,
        title: `Goal #${n}`,
      }
    }),
    artifactURL: factory.sequence(n => `http://artifact.example.com/${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
