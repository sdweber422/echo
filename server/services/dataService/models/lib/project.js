import {type} from 'thinky'

const {string, date, array, object} = type

export default {
  name: 'Project',
  table: 'projects',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    name: string()
      .min(1)
      .required()
      .allowNull(false),

    goal: object()
      .required()
      .allowNull(false),

    playerIds: array()
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
  associate: (Project, models) => {
    Project.belongsTo(models.Chapter, 'chapter', 'chapterId', 'id', {init: false})
    Project.belongsTo(models.Cycle, 'cycle', 'cycleId', 'id', {init: false})
    Project.belongsTo(models.Survey, 'projectReviewSurvey', 'projectReviewSurveyId', 'id', {init: false})
    Project.belongsTo(models.Survey, 'retrospectiveSurvey', 'retrospectiveSurveyId', 'id', {init: false})
  },
}
