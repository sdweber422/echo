import faker from 'faker'

import {PlayerPool} from 'src/server/services/dataService'

const now = new Date()

export default function define(factory) {
  factory.define('playerPool', PlayerPool, {
    id: cb => cb(null, faker.random.uuid()),
    playerId: cb => cb(null, faker.random.uuid()),
    poolId: cb => cb(null, faker.random.uuid()),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
