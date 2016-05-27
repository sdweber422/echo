import faker from 'faker'
import r from '../../db/connect'

const now = new Date()

export default function define(factory) {
  factory.define('survey', r.table('surveys'), {
    id: cb => cb(null, faker.random.uuid()),
    cycleId: factory.assoc('cycle', 'id'),
    projectId: factory.assoc('project', 'id'),
    questions: [],
    // This doesn't work =(
    // questions: [
    //   {
    //     questionId: factory.assoc('question', 'id'),
    //     subject: factory.assocMany('player', 'id', 4),
    //   }
    // ],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}

