import {type} from 'thinky'
import {CYCLE_STATES} from 'src/common/models/cycle'

const {string, number, date} = type

export default {
  name: 'Cycle',
  table: 'cycles',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    cycleNumber: number()
      .integer()
      .min(1)
      .required()
      .allowNull(false),

    state: string()
      .enum(CYCLE_STATES)
      .required()
      .allowNull(false),

    startTimestamp: date()
      .required()
      .allowNull(false),

    createdAt: date()
      .required()
      .allowNull(false)
      .default(new Date()),

    updatedAt: date()
      .required()
      .allowNull(false)
      .default(new Date()),
  },
  associate: (Cycle, models) => {
    Cycle.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
  },
}
