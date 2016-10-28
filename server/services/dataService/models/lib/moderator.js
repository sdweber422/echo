import {type} from 'thinky'

const {string, date, boolean} = type

export default {
  name: 'Moderator',
  table: 'moderators',
  schema: {
    id: string()
      .uuid(4)
      .required()
      .allowNull(false),

    active: boolean()
      .required()
      .allowNull(false)
      .default(true),

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
