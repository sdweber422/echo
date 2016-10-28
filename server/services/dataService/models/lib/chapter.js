import {type} from 'thinky'

const {string, number, date, array} = type

export default {
  name: 'Chapter',
  table: 'chapters',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    name: string()
      .required()
      .allowNull(false),

    channelName: string()
      .required()
      .allowNull(false),

    timezone: string()
      .required()
      .allowNull(false),

    goalRepositoryURL: string()
      .required()
      .allowNull(false),

    githubTeamId: number()
      .integer()
      .required()
      .allowNull(true)
      .default(null),

    cycleDuration: string()
      .required()
      .allowNull(false),

    cycleEpoch: date()
      .required()
      .allowNull(false),

    inviteCodes: array()
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
  associate: (Chapter, models) => {
    Chapter.hasMany(models.Cycle, 'cycles', 'id', 'chapterId', {init: false})
    Chapter.hasMany(models.Project, 'projects', 'id', 'chapterId', {init: false})
  },
}
