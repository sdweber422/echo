exports.up = function (r) {
  const sevenDays = 60 * 60 * 24 * 7
  return r.table('projects')
    .filter({state: 'CLOSED'})
    .update(_ => ({closedAt: _('createdAt').add(sevenDays)}))
}

exports.down = function (r) {
  return r.table('projects')
    .update({closedAt: r.literal()})
}
