import {type} from 'thinky'

const {string, date} = type

export default {
  name: 'Player',
  table: 'players',
  schema: {
    id: string()
      .uuid(4)
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
  associate: (Player, models) => {
    Player.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
  },
}
