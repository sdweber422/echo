export function up(r) {
  return r.table('projects')
    .filter({state: 'CLOSED_FOR_REVIEW'})
    .update({
      state: 'CLOSED',
      closedAt: new Date(),
    })
}

export function down() {
  // down migration not possible; up migration will be permanent.
}
