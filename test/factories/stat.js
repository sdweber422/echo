import faker from 'faker'

import {Stat} from 'src/server/services/dataService'

const now = new Date()

export default function define(factory) {
  factory.define('stat', Stat, {
    id: cb => cb(null, faker.random.uuid()),
    descriptor: factory.sequence(n => `stat${n}`),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
