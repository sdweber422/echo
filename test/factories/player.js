import faker from 'faker'

import r from 'src/db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('player', r.table('players'), {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    chapterHistory: [],
    stats: {ecc: 0, elo: {rating: 1000}},
    active: true,
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
