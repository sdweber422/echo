export function up(r) {
  return r.table('chapters').update({
    goalRepositoryURL: r.literal(),
  })
}

export function down(r) {
  return r.table('chapters').update({
    goalRepositoryURL: 'https://github.com/GuildCrafts/web-development-js',
  })
}
