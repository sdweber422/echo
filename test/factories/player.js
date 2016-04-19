import faker from 'faker'

const now = new Date()

export default function define(factory) {
  factory.define('player', null, {
    id: cb => cb(null, faker.random.uuid()),
    chapter: factory.assoc('chapter'),
    chapterHistory: [],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
