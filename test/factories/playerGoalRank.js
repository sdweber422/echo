import faker from 'faker'

export default function define(factory) {
  factory.define('playerGoalRank', null, {
    playerId: cb => cb(null, faker.random.uuid()),
    goalRank: 1,
  })
}
