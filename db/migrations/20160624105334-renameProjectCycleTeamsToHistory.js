/* eslint-disable no-var */
var config = require('src/db/config')

config()

exports.up = function up(r, conn) {
  return r.table('projects').replace(
    r.row.merge(row => ({
      history: row('cycleTeams')
        .keys()
        .orderBy(cycleId => r.table('cycles').get(cycleId)('cycleNumber'))
        .map(cycleId =>
          row('cycleTeams')(cycleId).merge({cycleId})
        )
    })).without('cycleTeams'),
    {nonAtomic: true}
  ).run(conn)
}

exports.down = function down(r, conn) {
  return r.table('projects').replace(
    r.row.merge(row => ({
      cycleTeams: row('history')
        .fold({}, (left, right) => left.merge(r.object(right('cycleId'), right.without('cycleId'))))
    }))
    .without('history')
  ).run(conn)
}
