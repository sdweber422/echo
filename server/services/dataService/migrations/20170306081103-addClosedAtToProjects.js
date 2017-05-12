exports.up = function (r) {
  const sevenDays = 60 * 60 * 24 * 7
  return Promise.all([
    r.table('projects')
      .filter({state: 'CLOSED'})
      .update(_ => ({closedAt: _('createdAt').add(sevenDays)})),
    r.table('projects').indexCreate('closedAt'),
  ])
}

exports.down = function (r) {
  return Promise.all([
    r.table('projects').update({closedAt: r.literal()}),
    r.table('projects').indexDrop('closedAt'),
  ])
}
