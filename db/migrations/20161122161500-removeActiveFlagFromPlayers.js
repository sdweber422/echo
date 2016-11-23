export async function up(r, conn) {
  const players = await r.table('players').run(conn)
  console.info('Player IDs and active fields:')
  players.forEach(player => console.info(`${player.id}: ${player.active}`))

  return r.table('players').replace(row => row.without('active')).run(conn)
}

export function down(/* r, conn */) {
  console.error('Cannot undo this migration because it was destructive.')
}
