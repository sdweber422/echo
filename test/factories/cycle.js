import faker from 'faker'

import {CYCLE_STATES} from '../../common/validations/cycle'

const now = new Date()

export default function define(factory) {
  factory.define('cycle', null, {
    id: cb => cb(null, faker.random.uuid()),
    chapter: factory.assoc('chapter'),
    cycleNumber: faker.random.number({min: 1, max: 40}),
    startTimestamp: cb => cb(null, now),
    state: cb => cb(null, faker.random.arrayElement(CYCLE_STATES)),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
