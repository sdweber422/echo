import {r, type} from 'src/server/util/thinky'

const {string, date} = type

export default {
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

    createdAt: date()
      .allowNull(false)
      .default(r.now()),

    updatedAt: date()
      .allowNull(false)
      .default(r.now()),
  },
  associate: (Vote, models) => {
    Vote.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
  },
}
