export default function poolModel(thinky) {
  const {r, type: {string, number, array, date}} = thinky

  return {
    name: 'Pool',
    table: 'pools',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      cycleId: string()
        .uuid(4)
        .allowNull(false),

      name: string()
        .allowNull(false),

      levels: array(number().integer().min(0).max(5))
        .allowNull(false)
        .default([]),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Pool, models) => {
      Pool.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
    },
  }
}
