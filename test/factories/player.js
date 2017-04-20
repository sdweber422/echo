import faker from 'faker'

import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {Player} from 'src/server/services/dataService'

const {
  ELO,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
} = STAT_DESCRIPTORS

const now = new Date()

export default function define(factory) {
  factory.define('player', Player, {
    id: cb => cb(null, faker.random.uuid()),
    chapterId: factory.assoc('chapter', 'id'),
    chapterHistory: [],
    stats: {[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 0, [ELO]: {rating: 1000}},
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
