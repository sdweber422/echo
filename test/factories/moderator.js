import faker from 'faker'

import r from 'src/db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('moderator', r.table('moderators'), {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
