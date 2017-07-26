import config from 'src/config'
import Promise from 'bluebird'

const createOptions = config.server.rethinkdb.tableCreation

export async function up(r, connection) {
  const moderators = await r.table('moderators').run(connection)

  await Promise.each(moderators, async moderator => {
    const memberFound = await r.table('members')
      .get(moderator.id)
      .default(false)
      .run(connection)

    if (!memberFound) {
      return r.table('members').insert(moderator).run(connection)
    }
  })

  await r.tableDrop('moderators').run(connection)
}

export async function down(r, connection) {
  await r.tableCreate('moderators', createOptions).run(connection)
  await r.table('moderators').indexCreate('chapterId').run(connection)
}
