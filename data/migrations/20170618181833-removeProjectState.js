export async function up(r) {
  await r.table('projects').indexDrop('closedAt')
  await r.table('projects').replace(project => (
    project.without('state', 'closedAt', 'reviewStartedAt')
  ))
}

export function down() {
  // irreversible
}
