import thinky from 'thinky'

import {QUESTION_SUBJECT_TYPES, QUESTION_RESPONSE_TYPES} from 'src/common/models/survey'

const {type, r} = thinky()
const {string, date, boolean, array} = type

export default {
  name: 'Question',
  table: 'questions',
  schema: {
    id: string()
      .uuid(4)
      .allowNull(false),

    statId: string()
      .uuid(4)
      .allowNull(false),

    body: string()
      .allowNull(false)
      .default(true),

    subjectType: string()
      .enum(Object.values(QUESTION_SUBJECT_TYPES))
      .allowNull(false),

    responseType: string()
      .enum(Object.values(QUESTION_RESPONSE_TYPES))
      .allowNull(false),

    validationOptions: array()
      .allowNull(false)
      .default({}),

    active: boolean()
      .allowNull(false)
      .default(true),

    createdAt: date()
      .allowNull(false)
      .default(r.now()),

    updatedAt: date()
      .allowNull(false)
      .default(r.now()),
  },
  associate: (Question, models) => {
    Question.belongsTo(models.Stat, 'stat', 'statId', 'id', {init: false})
  },
}
