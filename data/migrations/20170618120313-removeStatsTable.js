export function up(r, conn) {
  return r.tableDrop('stats').run(conn)
}

export function down() {
  // irreversible; cannot recover data in dropped table
}
