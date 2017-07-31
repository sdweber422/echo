export async function up(r) {
  return r.table('pools').replace(r.row.without('levels'))
}

export async function down() {
  // irreversible; cannot recover data
}
