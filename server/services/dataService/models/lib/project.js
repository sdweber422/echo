import thinky from 'thinky'

const {type, r} = thinky()
const {string, date, array, object} = type

export default {
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

    goal: object()
      .allowNull(false)
      .allowExtra(true),

    playerIds: array()
      .allowNull(false),

    projectReviewSurveyId: string()
      .uuid(4)
      .allowNull(false),

    retrospectiveSurveyId: string()
      .uuid(4)
      .allowNull(false),

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
    Project.belongsTo(models.Survey, 'projectReviewSurvey', 'projectReviewSurveyId', 'id', {init: false})
    Project.belongsTo(models.Survey, 'retrospectiveSurvey', 'retrospectiveSurveyId', 'id', {init: false})
  },
}
