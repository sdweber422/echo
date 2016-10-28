import {type} from 'thinky'

const {string, date, array} = type

export default {
  name: 'SurveyBlueprint',
  table: 'surveyBlueprints',
  schema: {
    id: string()
      .uuid(4)
      .required()
      .allowNull(false),

    descriptor: string()
      .required()
      .allowNull(false),

    defaultQuestionRefs: array()
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
}
