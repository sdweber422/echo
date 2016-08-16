import faker from 'faker'

import r from 'src/db/connect'
import {CYCLE_STATES} from 'src/common/models/cycle'

const now = new Date()

export default function define(factory) {
  factory.define('cycle', r.table('cycles'), {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    cycleNumber: factory.sequence(n => n),
    startTimestamp: cb => cb(null, now),
    state: CYCLE_STATES[0],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
