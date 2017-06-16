export default function playerModel(thinky) {
  const {r, type: {string, date, object, array}} = thinky

  return {
    name: 'Player',
    table: 'players',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      chapterId: string()
        .uuid(4)
        .allowNull(false),

      phaseId: string()
        .uuid(4)
        .allowNull(true),

      stats: object()
        .allowExtra(true),

      statsBaseline: object()
        .allowExtra(true),

      chapterHistory: array()
        .default([]),

      statsComputedAt: date(),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Player, models) => {
      Player.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
      Player.belongsTo(models.Phase, 'phase', 'phaseId', 'id', {init: false})
    },
  }
}
