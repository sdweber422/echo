export default function playerPool(thinky) {
  const {r, type: {string, date}} = thinky

  return {
    name: 'PlayerPool',
    table: 'playersPools',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      playerId: string()
        .uuid(4)
        .allowNull(false),

      poolId: string()
        .uuid(4)
        .allowNull(false),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: () => {},
  }
}
