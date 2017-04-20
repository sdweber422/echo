import faker from 'faker'

import {Pool} from 'src/server/services/dataService'

const now = new Date()

export default function define(factory) {
  factory.define('pool', Pool, {
    id: cb => cb(null, faker.random.uuid()),
    name: factory.sequence(n => `pool${n}`),
    levels: [1],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
