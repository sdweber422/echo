import {IN_PROGRESS} from 'src/common/models/project'

export default function projectModel(thinky) {
  const {r, type: {string, date, number, array, object}} = thinky

  return {
    name: 'Project',
    table: 'projects',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      chapterId: string()
        .uuid(4)
        .allowNull(false),

      cycleId: string()
        .uuid(4)
        .allowNull(false),

      name: string()
        .min(1)
        .allowNull(false),

      playerIds: array()
        .allowNull(false),

      retrospectiveSurveyId: string()
        .uuid(4),

      goal: object()
        .allowNull(false)
        .allowExtra(true),

      artifactURL: string()
        .min(1),

      expectedHours: number()
        .integer()
        .min(1)
        .allowNull(false),

      state: string()
        .allowNull(false)
        .default(IN_PROGRESS),

      stats: object()
        .allowExtra(true),

      reviewStartedAt: date()
        .allowNull(true),

      closedAt: date()
        .allowNull(true),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
    associate: (Project, models) => {
      Project.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
      Project.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
      Project.belongsTo(models.Survey, 'retrospectiveSurvey', 'retrospectiveSurveyId', 'id', {init: false})
    },
  }
}
