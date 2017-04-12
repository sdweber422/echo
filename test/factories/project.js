import faker from 'faker'

import {connect} from 'src/db'
import {REFLECTION} from 'src/common/models/cycle'
import {IN_PROGRESS, PROJECT_DEFAULT_EXPECTED_HOURS} from 'src/common/models/project'

const r = connect()
const now = new Date()

export default function define(factory) {
  const commonAttrs = {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    coachId(cb) {
      const {chapterId} = this
      const createCoach = factory.assoc('player', 'id', {chapterId})
      createCoach(cb)
    },
    cycleId(cb) {
      const {chapterId} = this
      const createCycles = factory.assocMany('cycle', 'id', 1, [{chapterId, state: REFLECTION}])
      createCycles((err, cycleIds) => cb(err, cycleIds[0]))
    },
    goal: factory.sequence(n => {
      const url = `https://jsdev.example.com/goals/${n}`
      const title = `Goal #${n}`
      const xpValue = 100
      const level = 1
      const dynamic = false
      return {
        number: n,
        url,
        title,
        xpValue,
        level,
        dynamic,
        goalMetadata: {
          url,
          title,
          goal_id: n, // eslint-disable-line camelcase
          xp_value: xpValue, // eslint-disable-line camelcase
          level,
          dynamic,
        },
      }
    }),
    expectedHours: PROJECT_DEFAULT_EXPECTED_HOURS,
    state: IN_PROGRESS,
    reviewStartedAt: null,
    artifactURL: factory.sequence(n => `http://artifact.example.com/${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  }

  factory.define('project', r.table('projects'), {
    ...commonAttrs,
    playerIds(cb) {
      const {chapterId} = this
      const createPlayers = factory.assocMany('player', 'id', 4, {chapterId})
      createPlayers((err, playerIds) => {
        cb(err, playerIds.slice(0, 4))
      })
    },
  })

  factory.define('single player project', r.table('projects'), {
    ...commonAttrs,
    playerIds(cb) {
      const {chapterId} = this
      const createPlayers = factory.assocMany('player', 'id', 1, {chapterId})
      createPlayers((err, playerIds) => {
        cb(err, playerIds.slice(0, 1))
      })
    },
  })
}
