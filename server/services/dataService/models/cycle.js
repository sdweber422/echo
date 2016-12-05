import {r, type} from 'src/server/util/thinky'
import {CYCLE_STATES} from 'src/common/models/cycle'

const {string, number, date} = type

export default {
  name: 'Cycle',
  table: 'cycles',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    chapterId: string()
      .uuid(4)
      .allowNull(false),

    cycleNumber: number()
      .integer()
      .min(1)
      .allowNull(false),

    state: string()
      .enum(CYCLE_STATES)
      .allowNull(false),

    startTimestamp: date()
      .allowNull(false),

    endTimestamp: date()
      .allowNull(false),

    createdAt: date()
      .allowNull(false)
      .default(r.now()),

    updatedAt: date()
      .allowNull(false)
      .default(r.now()),
  },
  associate: (Cycle, models) => {
    Cycle.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
  },
}
