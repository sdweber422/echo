export function up(r, conn) {
  return r.table('surveyBlueprints').replace(
    r.row.merge(row => ({
      defaultQuestionRefs: row('defaultQuestionIds').map(questionId => ({questionId}))
    }))
    .without('defaultQuestionIds')
  ).run(conn)
}

export function down(r, conn) {
  return r.table('surveyBlueprints').replace(
    r.row.merge(row => ({
      defaultQuestionIds: row('defaultQuestionRefs').map(ref => ref('questionId'))
    }))
    .without('defaultQuestionRefs')
  ).run(conn)
}
