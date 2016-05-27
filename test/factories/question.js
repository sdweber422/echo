import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('question', r.table('questions'), {
    id: cb => cb(null, faker.random.uuid()),
    prompt: 'How much did each team member contribute this cycle?',
    type: 'percentage',
    subjectType: 'team',
    active: true,
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
