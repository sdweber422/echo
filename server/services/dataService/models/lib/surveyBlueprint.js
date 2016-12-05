import thinky from 'thinky'

const {type, r} = thinky()
const {string, date, array} = type

export default {
  name: 'SurveyBlueprint',
  table: 'surveyBlueprints',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    descriptor: string()
      .allowNull(false),

    defaultQuestionRefs: array()
      .allowNull(false),

    createdAt: date()
      .allowNull(false)
      .default(r.now()),

    updatedAt: date()
      .allowNull(false)
      .default(r.now()),
  },
}
