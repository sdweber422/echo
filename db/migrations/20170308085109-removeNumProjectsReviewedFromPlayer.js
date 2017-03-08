exports.up = function (r) {
  return r.table('players')
    .hasFields({stats: {numProjectsReviewed: true}})
    .update({stats: {numProjectsReviewed: r.literal()}})
}

exports.down = function () {
  /* not going to attempt to recover this data */
}
