export function up(r, conn) {
  return r.table('projects')
    .replace(row => row.without('stats'))
    .run(conn)
}

export function down() {
  // irreversible; cannot recover data
}
