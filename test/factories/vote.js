import faker from 'faker'

const now = new Date()

export default function define(factory) {
  factory.define('vote', null, {
    id: cb => cb(null, faker.random.uuid()),
    player: factory.assoc('player'),
    cycle: factory.assoc('cycle'),
    goals: cb => cb(null, [
      'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/50',
      'https://github.com/GuildCraftsTesting/web-development-js-testing/issues/49',
    ]),
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
