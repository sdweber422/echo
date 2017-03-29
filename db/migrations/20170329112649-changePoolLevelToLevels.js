exports.up = function (r) {
  return r.table('pools').replace(pool =>
    pool.merge(_ => ({
      levels: r.branch(
        _.hasFields('level'),
        [_('level')],
        []
      ),
      level: r.literal(),
    }))
  )
}

exports.down = function (r) {
  return r.table('pools').replace(pool =>
    pool.merge(_ => ({
      level: r.branch(
        _('levels').count().gt(0),
        _('levels').nth(0),
        null
      ),
      levels: r.literal(),
    }))
  )
}
