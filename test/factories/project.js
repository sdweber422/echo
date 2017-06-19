import faker from 'faker'

import {REFLECTION} from 'src/common/models/cycle'
import {Project} from 'src/server/services/dataService'

const now = new Date()

export default function define(factory) {
  const commonAttrs = {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `funky-falcon-${n}`),
    chapterId: factory.assoc('chapter', 'id'),
    cycleId(cb) {
      const {chapterId} = this
      const createCycles = factory.assocMany('cycle', 'id', 1, [{chapterId, state: REFLECTION}])
      createCycles((err, cycleIds) => cb(err, cycleIds[0]))
    },
    goal: factory.sequence(n => {
      const url = `https://jsdev.example.com/goals/${n}`
      const title = `Goal #${n}`
      const baseXp = 100
      const bonusXp = 15
      const teamSize = 2
      const level = 1
      const dynamic = false
      return {
        number: n,
        url,
        title,
        baseXp,
        bonusXp,
        teamSize,
        level,
        dynamic,
        goalMetadata: {
          url,
          title,
          goal_id: n, // eslint-disable-line camelcase
          base_xp: baseXp, // eslint-disable-line camelcase
          bonus_xp: bonusXp, // eslint-disable-line camelcase
          team_size: teamSize, // eslint-disable-line camelcase
          level,
          dynamic,
        },
      }
    }),
    artifactURL: factory.sequence(n => `http://artifact.example.com/${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  }

  factory.define('project', Project, {
    ...commonAttrs,
    playerIds(cb) {
      const {chapterId} = this
      const createPlayers = factory.assocMany('player', 'id', 4, {chapterId})
      createPlayers((err, playerIds) => {
        cb(err, playerIds.slice(0, 4))
      })
    },
  })

  factory.define('single player project', Project, {
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
