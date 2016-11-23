import {type} from 'thinky'

const {string, date} = type

export default {
  name: 'Moderator',
  table: 'moderators',
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
  associate: (Moderator, models) => {
    Moderator.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
  },
}
