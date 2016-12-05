import thinky from 'thinky'

const {type, r} = thinky()
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
      .allowNull(false)
      .default(r.now()),

    updatedAt: date()
      .allowNull(false)
      .default(r.now()),
  },
  associate: (Survey, models) => {
    Survey.hasMany(models.Question, 'questions', 'id', 'surveyId', {init: false})
  },
}
