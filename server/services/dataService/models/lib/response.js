import {type} from 'thinky'

const {string, date, any} = type

export default {
  name: 'Response',
  table: 'responses',
  schema: {
    id: string()
      .uuid(4)
      .required()
      .allowNull(false),

    subjectId: string()
      .uuid(4)
      .required()
      .allowNull(false),

    respondentId: string()
      .uuid(4)
      .required()
      .allowNull(false),

    active: any()
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
  associate: (Response, models) => {
    Response.belongsTo(models.Question, 'question', 'questionId', 'id', {init: false})
    Response.belongsTo(models.Survey, 'survey', 'surveyId', 'id', {init: false})
  },
}
