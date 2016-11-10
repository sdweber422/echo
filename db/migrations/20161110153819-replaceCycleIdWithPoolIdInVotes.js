export async function up(r, conn) {
  await r.table('votes').indexCreate('playerIdAndPoolId', [r.row('playerId'), r.row('poolId')]).run(conn)
  await r.table('votes').indexDrop('playerIdAndCycleId').run(conn)
}

export async function down(r, conn) {
  await r.table('votes').indexCreate('playerIdAndCycleId', [r.row('playerId'), r.row('cycleId')]).run(conn)
  await r.table('votes').indexDrop('playerIdAndPoolId').run(conn)
}
