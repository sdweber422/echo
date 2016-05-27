import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('response', r.table('responses'), {
    id: cb => cb(null, faker.random.uuid()),
    questionId: factory.assoc('question', 'id'),
    respondantId: factory.assoc('player', 'id'),
    subject: factory.assoc('player', 'id'),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}

