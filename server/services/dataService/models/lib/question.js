import {type} from 'thinky'
import {QUESTION_SUBJECT_TYPES, QUESTION_RESPONSE_TYPES} from 'src/common/models/survey'

const {string, date, boolean, array} = type

export default {
  name: 'Question',
  table: 'questions',
  schema: {
    id: string()
      .uuid(4)
      .required()
      .allowNull(false),

    body: string()
      .required()
      .allowNull(false)
      .default(true),

    subjectType: string()
      .enum(QUESTION_SUBJECT_TYPES)
      .required()
      .allowNull(false),

    responseType: string()
      .enum(QUESTION_RESPONSE_TYPES)
      .required()
      .allowNull(false),

    validationOptions: array()
      .required()
      .allowNull(false)
      .default([]),

    active: boolean()
      .required()
      .allowNull(false)
      .default(true),

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
