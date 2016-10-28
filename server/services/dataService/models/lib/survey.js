import {type} from 'thinky'

const {string, date, array} = type

export default {
  name: 'Survey',
  table: 'surveys',
  schema: {
    id: string()
      .uuid(4)
      .required()
      .allowNull(false),

    completedBy: array()
      .required()
      .allowNull(false),

    questionRefs: array()
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
  associate: (Survey, models) => {
    Survey.hasMany(models.Question, 'questions', 'id', 'surveyId', {init: false})
  },
}
