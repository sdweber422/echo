import Promise from 'bluebird'

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

export async function down() {
  // irreversible; data from dropped table not recoverable
}
