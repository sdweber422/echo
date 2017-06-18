import faker from 'faker'

import {Player} from 'src/server/services/dataService'

const now = new Date()

export default function define(factory) {
  factory.define('player', Player, {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    chapterHistory: [],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
