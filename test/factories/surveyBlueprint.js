import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('surveyBlueprint', r.table('surveyBlueprints'), {
    id: cb => cb(null, faker.random.uuid()),
    descriptor: factory.sequence(n => `surveyBlueprint${n}`),
    defaultQuestionIds: factory.assocMany('question', 'id', 4),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
