export async function up(r, conn) {
  await r.table('cycles')
    .replace(cycle => cycle.without('projectDefaultExpectedHours'))
    .run(conn)

  await r.table('projects')
    .replace(project => project.without('expectedHours'))
    .run(conn)
}

export function down() {
  // irreversible; cannot recover data
}
