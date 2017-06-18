export function up(r, conn) {
  return r.table('players')
    .replace(row => row.without('stats', 'statsBaseline', 'statsComputedAt'))
    .run(conn)
}

export function down() {
  // irreversible; cannot recover data
}
