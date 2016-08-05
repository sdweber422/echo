exports.up = function (r, conn) {
  return r.table('responses')
    .indexCreate('surveyId')
    .run(conn)
}

exports.down = function (r, conn) {
  return r.table('responses')
    .indexDrop('surveyId')
    .run(conn)
}
