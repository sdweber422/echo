import faker from 'faker'

import r from 'src/db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('surveyBlueprint', r.table('surveyBlueprints'), {
    id: cb => cb(null, faker.random.uuid()),
    descriptor: factory.sequence(n => `surveyBlueprint${n}`),
    defaultQuestionRefs: [],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
