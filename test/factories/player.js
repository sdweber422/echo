import faker from 'faker'

import {connect} from 'src/db'

const r = connect()
const now = new Date()

export default function define(factory) {
  factory.define('player', r.table('players'), {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    chapterHistory: [],
    stats: {ecc: 0, elo: {rating: 1000}},
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
