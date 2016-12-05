import {r, type} from 'src/server/util/thinky'

const {string, number, date, array} = type

export default {
  name: 'Chapter',
  table: 'chapters',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    name: string()
      .allowNull(false),

    channelName: string()
      .allowNull(false),

    timezone: string()
      .allowNull(false),

    goalRepositoryURL: string()
      .allowNull(false),

    githubTeamId: number()
      .integer()
      .allowNull(true)
      .default(null),

    cycleDuration: string()
      .allowNull(false),

    cycleEpoch: date()
      .allowNull(false),

    inviteCodes: array()
      .allowNull(false),

    createdAt: date()
      .allowNull(false)
      .default(r.now()),

    updatedAt: date()
      .allowNull(false)
      .default(r.now()),
  },
  associate: (Chapter, models) => {
    Chapter.hasMany(models.Cycle, 'cycles', 'id', 'chapterId', {init: false})
    Chapter.hasMany(models.Project, 'projects', 'id', 'chapterId', {init: false})
  },
}
