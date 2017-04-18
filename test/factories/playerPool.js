import faker from 'faker'

import {connect} from 'src/db'

const r = connect()
const now = new Date()

export default function define(factory) {
  factory.define('playerPool', r.table('playersPools'), {
    id: cb => cb(null, faker.random.uuid()),
    playerId: cb => cb(null, faker.random.uuid()),
    poolId: cb => cb(null, faker.random.uuid()),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
